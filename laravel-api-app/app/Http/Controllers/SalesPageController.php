<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateSalesPageJob;
use App\Mail\SalesPageProposalMail;
use App\Models\SalesPage;
use App\Services\OpenAIService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class SalesPageController extends Controller
{
    public function index()
    {
        return SalesPage::where('user_id', auth()->id())->latest()->paginate(9);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'product_name' => 'required|string|max:100',
            'product_description' => 'required|string|min:50',
            'key_features' => 'required|array|min:1|max:10',
            'target_audience' => 'required|string|max:255',
            'price' => 'required|string|max:255',
            'uom' => 'required|string|max:32',
            'price_currency' => 'required|string|size:3',
            'display_currency' => 'required|string|size:3',
            'converted_price_display' => 'nullable|string|max:64',
            'unique_selling_points' => 'nullable|string',
            'template' => 'required|in:modern,bold,elegant',
        ]);

        try {
            $page = SalesPage::create([
                ...$data,
                'user_id' => auth()->id(),
                'status' => 'pending',
            ]);
        } catch (QueryException $e) {
            $msg = strtolower($e->getMessage());
            if (
                str_contains($msg, 'price_currency') ||
                str_contains($msg, 'display_currency') ||
                str_contains($msg, 'converted_price_display') ||
                str_contains($msg, 'uom') ||
                str_contains($msg, 'no column named')
            ) {
                return response()->json([
                    'message' => 'Skema basis data belum sinkron (kolom currency/UOM belum ada). Jalankan: php artisan migrate pada folder laravel-api-app, lalu restart php artisan serve.',
                ], 503);
            }

            throw $e;
        }

        GenerateSalesPageJob::dispatch($page);
        return response()->json($page, 202);
    }

    public function show(SalesPage $salesPage)
    {
        $this->authorizeOwnership($salesPage);
        return $salesPage;
    }

    public function destroy(SalesPage $salesPage)
    {
        $this->authorizeOwnership($salesPage);
        $salesPage->delete();
        return response()->json(['message' => 'Deleted']);
    }

    public function generate(SalesPage $salesPage)
    {
        $this->authorizeOwnership($salesPage);
        GenerateSalesPageJob::dispatch($salesPage);
        return response()->json(['message' => 'Generation started'], 202);
    }

    public function regenerateSection(Request $request, SalesPage $salesPage, OpenAIService $openAI)
    {
        $this->authorizeOwnership($salesPage);
        $data = $request->validate([
            'section' => 'required|in:headline,sub_headline,product_description,benefits,features,social_proof,pricing,cta',
        ]);

        $updated = $openAI->regenerateSection($salesPage->toArray(), $data['section'], $salesPage->generated_content ?? []);
        $salesPage->update(['generated_content' => $updated]);

        return response()->json([
            'section' => $data['section'],
            'content' => $updated[$data['section']] ?? null,
        ]);
    }

    public function updateTemplate(Request $request, SalesPage $salesPage)
    {
        $this->authorizeOwnership($salesPage);
        $data = $request->validate(['template' => 'required|in:modern,bold,elegant']);
        $salesPage->update($data);
        return $salesPage->fresh();
    }

    public function export(SalesPage $salesPage)
    {
        $this->authorizeOwnership($salesPage);
        $html = $this->buildExportHtml($salesPage);

        return response($html, 200)
            ->header('Content-Type', 'text/html; charset=UTF-8')
            ->header('Content-Disposition', 'attachment; filename="' . Str::slug($salesPage->product_name) . '-sales-page.html"');
    }

    public function sendProposalEmail(SalesPage $salesPage)
    {
        $this->authorizeOwnership($salesPage);

        $user = auth()->user();
        $html = $this->buildExportHtml($salesPage);
        $file = Str::slug($salesPage->product_name).'-sales-page.html';

        $mailable = new SalesPageProposalMail(
            productName: $salesPage->product_name,
            senderName: (string) ($user?->name ?? 'User'),
            senderEmail: (string) ($user?->email ?? 'noreply@example.com'),
            htmlContent: $html,
            attachmentFileName: $file,
        );

        if (filter_var((string) ($user?->email), FILTER_VALIDATE_EMAIL)) {
            $mailable->replyTo((string) $user->email, (string) ($user?->name ?? 'User'));
        }

        Mail::to('abdullahbadres@gmail.com')->send($mailable);

        return response()->json([
            'message' => 'Email sent with HTML attachment.',
            'to' => 'abdullahbadres@gmail.com',
        ]);
    }

    private function buildExportHtml(SalesPage $salesPage): string
    {
        $gc = $salesPage->generated_content ?? [];
        $seoTitle = e(data_get($gc, 'seo_meta.title', $salesPage->product_name));
        $seoDesc = e(data_get($gc, 'seo_meta.description', ''));

        $headline = e($gc['headline'] ?? $salesPage->product_name);
        $sub = e($gc['sub_headline'] ?? '');
        $desc = e($gc['product_description'] ?? $salesPage->product_description ?? '');

        $benefitsHtml = $this->exportListSection($gc['benefits'] ?? [], 'h2', 'Why it matters');
        $featuresHtml = $this->exportFeaturesSection($gc['features'] ?? []);
        $socialHtml = $this->exportSocialSection($gc['social_proof'] ?? []);
        $pricingHtml = $this->exportPricingSection($gc['pricing'] ?? []);
        $ctaBtn = e(data_get($gc, 'cta.button_text', 'Get Started'));
        $ctaSupport = e(data_get($gc, 'cta.supporting_text', ''));
        $ctaUrgent = e(data_get($gc, 'cta.urgency_note', ''));

        $style = <<<'CSS'
body{font-family:system-ui,-apple-system,sans-serif;max-width:920px;margin:40px auto;padding:0 20px 64px;line-height:1.55;color:#0f172a;background:#fafafa}
h1{font-size:clamp(1.75rem,4vw,2.75rem);line-height:1.15;margin:0 0 .5rem}
.sub{font-size:1.15rem;opacity:.85;margin:0 0 1.5rem}
section{margin:2.25rem 0;padding-top:1.5rem;border-top:1px solid #e2e8f0}
h2{font-size:1.2rem;margin:0 0 1rem}
.grid2{display:grid;gap:1rem}
@media(min-width:640px){.grid2{grid-template-columns:1fr 1fr}}
.card{border:1px solid #e2e8f0;border-radius:12px;padding:1rem;background:#fff}
.feat{display:flex;gap:.75rem;margin-bottom:1rem}
.icon{width:26px;height:26px;border-radius:8px;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0}
.stats{display:flex;flex-wrap:wrap;gap:1rem}
.stat{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:.75rem 1.25rem;text-align:center}
.cta-wrap{text-align:center;margin:2.5rem 0;padding:2.5rem 1.5rem;background:#0f172a;color:#f8fafc;border-radius:16px}
.cta-wrap button{margin-top:1rem;background:#fff;color:#0f172a;border:none;padding:12px 28px;border-radius:10px;font-weight:600;cursor:pointer;font-size:1rem}
.quote{border-left:3px solid #38bdf8;padding-left:1rem;margin:1rem 0;font-style:italic}
.tag{font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;opacity:.65;margin-bottom:.35rem}
footer{font-size:.8rem;color:#64748b;margin-top:2rem;padding-top:1rem;border-top:1px solid #e2e8f0}
CSS;

        return <<<HTML
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="{$seoDesc}" />
  <title>{$seoTitle}</title>
  <style>{$style}</style>
</head>
<body>
  <header>
    <h1>{$headline}</h1>
    <p class="sub"><strong>{$sub}</strong></p>
    <p>{$desc}</p>
  </header>
  {$benefitsHtml}
  {$featuresHtml}
  {$socialHtml}
  {$pricingHtml}
  <div class="cta-wrap">
    <div class="tag">Call to action</div>
    <button type="button">{$ctaBtn}</button>
    <p style="margin-top:1rem;opacity:.9">{$ctaSupport}</p>
    <p style="margin-top:.5rem;font-size:.85rem;opacity:.75">{$ctaUrgent}</p>
  </div>
  <footer>
    
    <p><strong>{$seoTitle}</strong></p>
    <p>{$seoDesc}</p>
  </footer>
</body>
</html>
HTML;
    }

    /**
     * @param  array<int, mixed>  $items
     */
    private function exportListSection(array $items, string $headingTag, string $title): string
    {
        $out = '';
        $headingTag = in_array($headingTag, ['h2', 'h3'], true) ? $headingTag : 'h2';
        foreach ($items as $row) {
            if (! is_array($row)) {
                continue;
            }
            $t = e($row['title'] ?? '');
            $d = e($row['description'] ?? '');
            if ($t === '' && $d === '') {
                continue;
            }
            $out .= '<div class="card"><strong>'.$t.'</strong><p style="margin:.5rem 0 0;font-size:.95rem;opacity:.85">'.$d.'</p></div>';
        }
        if ($out === '') {
            return '';
        }

        return '<section><'.$headingTag.'>'.$title.'</'.$headingTag.'><div class="grid2">'.$out.'</div></section>';
    }

    /**
     * @param  array<int, mixed>  $features
     */
    private function exportFeaturesSection(array $features): string
    {
        $out = '';
        foreach ($features as $row) {
            if (! is_array($row)) {
                continue;
            }
            $t = e($row['title'] ?? '');
            $d = e($row['description'] ?? '');
            if ($t === '' && $d === '') {
                continue;
            }
            $out .= '<div class="feat"><span class="icon">&#10003;</span><div><strong>'.$t.'</strong><p style="margin:.35rem 0 0;font-size:.95rem;opacity:.85">'.$d.'</p></div></div>';
        }
        if ($out === '') {
            return '';
        }

        return '<section><h2>Features</h2>'.$out.'</section>';
    }

    /**
     * @param  array<string, mixed>  $social
     */
    private function exportSocialSection(array $social): string
    {
        $testimonials = $social['testimonials'] ?? [];
        $stats = $social['stats'] ?? [];
        $html = '';

        if (is_array($testimonials)) {
            foreach ($testimonials as $t) {
                if (! is_array($t)) {
                    continue;
                }
                $quote = e($t['quote'] ?? '');
                $name = e($t['name'] ?? '');
                $role = e($t['role'] ?? '');
                if ($quote === '') {
                    continue;
                }
                $who = $name.($role !== '' ? ' — '.$role : '');
                $html .= '<blockquote class="quote"><p>"'.$quote.'"</p><cite style="font-size:.85rem;font-style:normal;opacity:.8">&mdash; '.$who.'</cite></blockquote>';
            }
        }

        $statsHtml = '';
        if (is_array($stats)) {
            foreach ($stats as $s) {
                if (! is_array($s)) {
                    continue;
                }
                $v = e($s['value'] ?? '');
                $l = e($s['label'] ?? '');
                if ($v === '' && $l === '') {
                    continue;
                }
                $statsHtml .= '<div class="stat"><div style="font-size:1.5rem;font-weight:700">'.$v.'</div><div style="font-size:.8rem;opacity:.8">'.$l.'</div></div>';
            }
        }

        if ($html === '' && $statsHtml === '') {
            return '';
        }

        $blocks = '<section><h2>Social proof</h2>'.$html;
        if ($statsHtml !== '') {
            $blocks .= '<div class="stats">'.$statsHtml.'</div>';
        }
        $blocks .= '</section>';

        return $blocks;
    }

    /**
     * @param  array<string, mixed>  $pricing
     */
    private function exportPricingSection(array $pricing): string
    {
        $price = e($pricing['display_price'] ?? '');
        $note = e($pricing['billing_note'] ?? '');
        $value = e($pricing['value_statement'] ?? '');
        $included = $pricing['included'] ?? [];
        $incHtml = '';
        if (is_array($included)) {
            foreach ($included as $line) {
                $line = is_string($line) ? e($line) : '';
                if ($line === '') {
                    continue;
                }
                $incHtml .= '<li style="margin:.35rem 0">'.$line.'</li>';
            }
        }
        if ($price === '' && $note === '' && $value === '' && $incHtml === '') {
            return '';
        }
        $list = $incHtml !== '' ? '<ul style="margin:.75rem 0 0;padding-left:1.25rem">'.$incHtml.'</ul>' : '';

        return '<section><h2>Pricing</h2><div class="card">'
            .'<div style="font-size:2rem;font-weight:700">'.$price.'</div>'
            .($note !== '' ? '<p style="margin:.5rem 0;font-size:.95rem;opacity:.85">'.$note.'</p>' : '')
            .($value !== '' ? '<p style="margin:.75rem 0">'.$value.'</p>' : '')
            .$list
            .'</div></section>';
    }

    private function authorizeOwnership(SalesPage $salesPage): void
    {
        abort_if($salesPage->user_id !== auth()->id(), 403);
    }
}
