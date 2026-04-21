<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateSalesPageJob;
use App\Models\SalesPage;
use App\Services\OpenAIService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SalesPageController extends Controller
{
    public function index()
    {
        return SalesPage::where('user_id', auth()->id())
            ->latest()
            ->paginate(9);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'product_name' => 'required|string|max:100',
            'product_description' => 'required|string|min:50',
            'key_features' => 'required|array|min:1',
            'target_audience' => 'required|string|max:255',
            'price' => 'required|string|max:255',
            'unique_selling_points' => 'nullable|string',
            'template' => 'required|in:modern,bold,elegant',
        ]);

        $page = SalesPage::create([...$data, 'user_id' => auth()->id(), 'status' => 'pending']);
        GenerateSalesPageJob::dispatch($page);

        return response()->json($page, 202);
    }

    public function show(SalesPage $salesPage)
    {
        abort_if($salesPage->user_id !== auth()->id(), 403);
        return $salesPage;
    }

    public function destroy(SalesPage $salesPage)
    {
        abort_if($salesPage->user_id !== auth()->id(), 403);
        $salesPage->delete();
        return response()->json(['message' => 'Deleted']);
    }

    public function generate(SalesPage $salesPage)
    {
        abort_if($salesPage->user_id !== auth()->id(), 403);
        GenerateSalesPageJob::dispatch($salesPage);
        return response()->json(['message' => 'Generation started'], 202);
    }

    public function regenerateSection(Request $request, SalesPage $salesPage, OpenAIService $openAI)
    {
        abort_if($salesPage->user_id !== auth()->id(), 403);
        $validated = $request->validate([
            'section' => 'required|in:headline,sub_headline,product_description,benefits,features,social_proof,pricing,cta',
        ]);

        $updated = $openAI->regenerateSection($salesPage->toArray(), $validated['section'], $salesPage->generated_content ?? []);
        $salesPage->update(['generated_content' => $updated]);

        return response()->json(['section' => $validated['section'], 'content' => $updated[$validated['section']] ?? null]);
    }

    public function updateTemplate(Request $request, SalesPage $salesPage)
    {
        abort_if($salesPage->user_id !== auth()->id(), 403);
        $data = $request->validate(['template' => 'required|in:modern,bold,elegant']);
        $salesPage->update($data);
        return $salesPage->fresh();
    }

    public function export(SalesPage $salesPage)
    {
        abort_if($salesPage->user_id !== auth()->id(), 403);
        $content = $salesPage->generated_content ?? [];
        $html = "<html><body><h1>{$content['headline']}</h1><p>{$content['sub_headline']}</p></body></html>";

        return response($html, 200)
            ->header('Content-Type', 'text/html')
            ->header('Content-Disposition', 'attachment; filename="' . Str::slug($salesPage->product_name) . '-sales-page.html"');
    }
}
