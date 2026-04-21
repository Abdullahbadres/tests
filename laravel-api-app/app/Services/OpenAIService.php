<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use OpenAI\Laravel\Facades\OpenAI;

class OpenAIService
{
    public function generateFullPage(array $input): array
    {
        if (! config('services.openai.api_key')) {
            return $this->fallbackContent($input);
        }

        try {
            $response = OpenAI::chat()->create([
                'model' => config('services.openai.model', 'gpt-4o'),
                'max_tokens' => (int) config('services.openai.max_tokens', 4000),
                'messages' => [
                    ['role' => 'system', 'content' => $this->systemPrompt()],
                    ['role' => 'user', 'content' => $this->fullPagePrompt($input)],
                ],
            ]);

            return json_decode($response->choices[0]->message->content ?? '{}', true) ?? $this->fallbackContent($input);
        } catch (\Throwable $e) {
            Log::warning('OpenAI full page generation failed; using fallback content.', [
                'error' => $e->getMessage(),
            ]);

            return $this->fallbackContent($input);
        }
    }

    public function regenerateSection(array $input, string $section, array $currentContent): array
    {
        $fallbackSection = $this->synthesizeSection($input, $section, $currentContent);

        if (! config('services.openai.api_key')) {
            return array_merge($currentContent, $fallbackSection);
        }

        try {
            $response = OpenAI::chat()->create([
                'model' => config('services.openai.model', 'gpt-4o'),
                'max_tokens' => 1200,
                'messages' => [
                    ['role' => 'system', 'content' => $this->systemPrompt()],
                    ['role' => 'user', 'content' => $this->sectionPrompt($input, $section, $currentContent)],
                ],
            ]);

            $raw = $response->choices[0]->message->content ?? '{}';
            $newData = $this->decodeJsonObject($raw);

            // If model returns malformed JSON or misses requested key, ensure section still updates.
            if (! is_array($newData) || ! array_key_exists($section, $newData)) {
                $newData = $fallbackSection;
            }

            return array_merge($currentContent, $newData);
        } catch (\Throwable $e) {
            Log::warning('OpenAI section regeneration failed; preserving current content.', [
                'section' => $section,
                'error' => $e->getMessage(),
            ]);

            return array_merge($currentContent, $fallbackSection);
        }
    }

    private function systemPrompt(): string
    {
        return <<<'PROMPT'
You are an expert conversion copywriter and landing page strategist.
Return exactly one JSON object (no markdown fences, no commentary before or after).
Copy must be persuasive, specific to the product input, and suitable for a professional sales landing page—not generic placeholder slogans.
All string values must be plain text suitable for HTML (no raw HTML tags inside JSON strings).
PROMPT;
    }

    private function fullPagePrompt(array $input): string
    {
        return 'Transform the following raw product/service information into a complete structured sales page. '
            .'Return JSON with these keys only: '
            .'headline (string), sub_headline (string), product_description (string), '
            .'benefits (array of objects: title, description), '
            .'features (array of objects: title, description), '
            .'social_proof (object: testimonials array of {name, role, quote}, stats array of {value, label}; use realistic placeholder names where needed), '
            .'pricing (object: display_price, billing_note, value_statement, included array of strings), '
            .'cta (object: button_text, supporting_text, urgency_note optional), '
            .'seo_meta (object: title, description). '
            .'Tie benefits and features to the input. Pricing display_price should reflect the price/currency context from input where possible. '
            .'Raw input:\n'
            .json_encode($input, JSON_UNESCAPED_UNICODE);
    }

    private function sectionPrompt(array $input, string $section, array $currentContent): string
    {
        $name = (string) ($input['product_name'] ?? 'the product');

        return "Regenerate only the '{$section}' section and return VALID JSON with this exact single top-level key: '{$section}'. "
            .'Strict rules: do not include markdown, do not include extra keys, and keep format consistent with full page schema. '
            ."Every regenerated section MUST explicitly reference product_name '{$name}' (or clear pronoun referring to it). "
            .'Section guidance: headline/sub_headline must anchor to product_name; product_description must polish input product_description; '
            .'benefits must derive from unique_selling_points and key_features with persuasive buyer-centric outcomes; '
            .'social_proof should create realistic placeholder testimonials/stats and vary wording each regeneration. '
            .'Generate a fresh variant that is meaningfully different from Current generated_content for this section. '
            .'Product context: '.json_encode($input, JSON_UNESCAPED_UNICODE)
            .' Current generated_content: '.json_encode($currentContent, JSON_UNESCAPED_UNICODE);
    }

    private function decodeJsonObject(string $raw): array
    {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            return $decoded;
        }

        // Rescue common case where model wraps JSON in prose or code fences.
        if (preg_match('/\{(?:[^{}]|(?R))*\}/s', $raw, $m) === 1) {
            $decoded = json_decode($m[0], true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }

        return [];
    }

    private function synthesizeSection(array $input, string $section, array $currentContent): array
    {
        $name = (string) ($input['product_name'] ?? 'Your product');
        $audience = (string) ($input['target_audience'] ?? 'your audience');
        $desc = (string) ($input['product_description'] ?? '');
        $usp = trim((string) ($input['unique_selling_points'] ?? ''));
        $features = array_values(array_filter((array) ($input['key_features'] ?? []), fn ($v) => is_string($v) && $v !== ''));
        $price = $this->formatPriceForDisplay($input);

        $headlineOptions = [
            "{$name}: built to help {$audience} get better results faster",
            "Turn {$name} into your competitive edge",
            "Why teams choose {$name} to accelerate growth",
            "{$name} helps {$audience} move from effort to outcomes",
            "Grow with {$name} and convert more of the right buyers",
        ];
        $subHeadlineOptions = [
            "A clearer path for {$audience} with practical value from day one.",
            "Designed for {$audience} who want stronger outcomes without extra complexity.",
            "Purpose-built for {$audience}, with measurable value in real-world use.",
            "{$name} combines clarity, speed, and persuasive positioning for {$audience}.",
            "Use {$name} to turn buyer intent into confident purchase decisions.",
        ];
        $currentHeadline = (string) ($currentContent['headline'] ?? '');
        $currentSub = (string) ($currentContent['sub_headline'] ?? '');

        if ($section === 'headline') {
            return ['headline' => $this->pickDifferentString($headlineOptions, $currentHeadline)];
        }
        if ($section === 'sub_headline') {
            return ['sub_headline' => $this->pickDifferentString($subHeadlineOptions, $currentSub)];
        }
        if ($section === 'product_description') {
            $options = [
                $desc !== ''
                    ? "{$desc}\n\n{$name} helps {$audience} work more efficiently with a clear, outcome-focused workflow."
                    : "{$name} is crafted for {$audience}, combining practical capabilities with a simple path to value.",
                $desc !== ''
                    ? "{$name} transforms this core offer: {$desc}\n\nFor {$audience}, it reduces friction and improves conversion confidence."
                    : "{$name} gives {$audience} an easier way to deliver stronger outcomes with less operational friction.",
                $desc !== ''
                    ? "{$desc}\n\nWith {$name}, {$audience} can move faster while keeping quality and consistency high."
                    : "{$name} was designed for {$audience} who need dependable results without adding complexity.",
            ];
            $polished = $this->pickDifferentString($options, (string) ($currentContent['product_description'] ?? ''));
            return ['product_description' => $polished];
        }
        if ($section === 'benefits') {
            $seed = $usp !== '' ? preg_split('/[,.\n;]+/', $usp) ?: [] : [];
            $seed = array_values(array_filter(array_map(fn ($v) => trim((string) $v), $seed), fn ($v) => $v !== ''));
            $first = $seed[0] ?? ($features[0] ?? 'Faster execution');
            $second = $seed[1] ?? ($features[1] ?? 'More consistent outcomes');
            $variants = [
                [
                    ['title' => $first, 'description' => "{$name} gives {$audience} a direct advantage by turning {$first} into tangible day-to-day value."],
                    ['title' => $second, 'description' => "{$name} helps buyers feel immediate impact with {$second} and clearer decision-making confidence."],
                ],
                [
                    ['title' => "Faster wins with {$name}", 'description' => "{$name} converts raw strengths like {$first} into persuasive outcomes your buyers can understand quickly."],
                    ['title' => "Higher confidence to buy", 'description' => "{$name} emphasizes {$second} so prospects can justify purchase decisions with less hesitation."],
                ],
                [
                    ['title' => "{$first} that buyers notice", 'description' => "Position {$name} around {$first} to make value obvious from first read to CTA."],
                    ['title' => "{$second} for long-term growth", 'description' => "{$name} turns {$second} into repeatable business value that supports retention and referrals."],
                ],
            ];
            $picked = $this->pickDifferentArray($variants, $currentContent['benefits'] ?? []);
            return [
                'benefits' => $picked,
            ];
        }
        if ($section === 'features') {
            $mapped = array_map(
                fn ($f) => ['title' => $f, 'description' => "{$f} in {$name} helps {$audience} stay productive and focused on outcomes."],
                array_slice($features, 0, 6)
            );
            if ($mapped === []) {
                $mapped = [['title' => 'End-to-end workflow', 'description' => "{$name} helps {$audience} move from idea to result with less friction."]];
            }
            return ['features' => $mapped];
        }
        if ($section === 'social_proof') {
            $names = [['Aisha', 'Store Owner'], ['Rudi', 'Operations Lead'], ['Clara', 'Marketing Manager'], ['Bimo', 'Founder']];
            shuffle($names);
            $statsOptions = [
                [['value' => '94%', 'label' => "{$name} users report higher satisfaction"], ['value' => '2.1x', 'label' => 'average engagement lift']],
                [['value' => '89%', 'label' => "buyers say {$name} improved purchase confidence"], ['value' => '37%', 'label' => 'faster campaign launch']],
                [['value' => '96%', 'label' => "{$name} users see clearer value communication"], ['value' => '3.4x', 'label' => 'more qualified inquiries']],
            ];
            $stats = $statsOptions[array_rand($statsOptions)];
            $socialVariants = [
                [
                    'testimonials' => [
                        ['name' => $names[0][0], 'role' => $names[0][1], 'quote' => "{$name} helped us improve conversion and reduce manual effort in the first weeks."],
                        ['name' => $names[1][0], 'role' => $names[1][1], 'quote' => "{$name} feels simple for the team but powerful for growth and buyer confidence."],
                    ],
                    'stats' => $stats,
                ],
                [
                    'testimonials' => [
                        ['name' => $names[2][0], 'role' => $names[2][1], 'quote' => "After using {$name}, our product messaging became clearer and easier to sell."],
                        ['name' => $names[3][0], 'role' => $names[3][1], 'quote' => "{$name} helped us position benefits better, and customers responded immediately."],
                    ],
                    'stats' => $statsOptions[array_rand($statsOptions)],
                ],
            ];
            $pickedSocial = $this->pickDifferentArray($socialVariants, $currentContent['social_proof'] ?? []);
            return [
                'social_proof' => $pickedSocial,
            ];
        }
        if ($section === 'pricing') {
            return [
                'pricing' => [
                    'display_price' => $price,
                    'billing_note' => 'Flexible plans based on your scope and business needs.',
                    'value_statement' => "{$name} is priced to deliver ROI quickly for {$audience}.",
                    'included' => ['Core feature access', 'Guided onboarding', 'Priority support'],
                ],
            ];
        }
        if ($section === 'cta') {
            return [
                'cta' => [
                    'button_text' => 'Start with '.$name,
                    'supporting_text' => "See how {$name} fits your workflow in a short live walkthrough.",
                    'urgency_note' => 'Limited onboarding slots this week.',
                ],
            ];
        }

        return $currentContent;
    }

    /**
     * @param  array<int, string>  $options
     */
    private function pickDifferentString(array $options, string $current): string
    {
        $normalized = array_values(array_unique(array_filter(array_map('trim', $options), fn ($v) => $v !== '')));
        if ($normalized === []) {
            return $current;
        }
        if (count($normalized) === 1) {
            return $normalized[0];
        }
        $candidates = array_values(array_filter($normalized, fn ($v) => $v !== $current));
        if ($candidates === []) {
            return $normalized[array_rand($normalized)];
        }

        return $candidates[array_rand($candidates)];
    }

    /**
     * @param  array<int, array<mixed>>  $variants
     * @param  array<mixed>  $current
     * @return array<mixed>
     */
    private function pickDifferentArray(array $variants, array $current): array
    {
        if ($variants === []) {
            return $current;
        }

        $currentJson = json_encode($current);
        $candidates = array_values(array_filter($variants, fn ($v) => json_encode($v) !== $currentJson));
        if ($candidates === []) {
            return $variants[array_rand($variants)];
        }

        return $candidates[array_rand($candidates)];
    }

    private function formatPriceForDisplay(array $input): string
    {
        $amount = $input['price'] ?? '';
        $base = strtoupper((string) ($input['price_currency'] ?? ''));
        $target = strtoupper((string) ($input['display_currency'] ?? ''));
        $converted = $input['converted_price_display'] ?? null;

        if ($amount === '' || $amount === '0') {
            return 'Contact us';
        }

        if ($base === '') {
            return (string) $amount;
        }

        $line = "{$amount} {$base}";

        if ($target !== '' && $target !== $base && ! empty($converted)) {
            $line .= " (≈ {$converted} {$target})";
        }

        return $line;
    }

    private function fallbackContent(array $input): array
    {
        $name = $input['product_name'] ?? 'Produk Anda';
        $price = $this->formatPriceForDisplay($input);

        return [
            'headline' => "Boost {$name} sales starting today",
            'sub_headline' => "A practical solution for {$input['target_audience']}",
            'product_description' => $input['product_description'] ?? '',
            'benefits' => [
                ['title' => 'More Efficient', 'description' => 'Save time and effort with an automated workflow.'],
            ],
            'features' => collect($input['key_features'] ?? [])->map(fn ($f) => ['title' => $f, 'description' => "{$f} helps streamline your business operations."])->values()->all(),
            'social_proof' => [
                'testimonials' => [['name' => 'Customer A', 'role' => 'Owner', 'quote' => "{$name} proved to be valuable for our business."]],
                'stats' => [['value' => '97%', 'label' => 'Customer satisfaction']],
            ],
            'pricing' => [
                'display_price' => $price,
                'billing_note' => 'Pricing may vary based on your requirements.',
                'value_statement' => 'An investment designed for fast ROI.',
                'included' => ['Full feature access', 'Priority support'],
            ],
            'cta' => [
                'button_text' => 'Get Started Now',
                'supporting_text' => 'Free 15-minute consultation.',
                'urgency_note' => 'Limited onboarding slots available.',
            ],
            'seo_meta' => [
                'title' => "{$name} - A solution for modern businesses",
                'description' => "Discover {$name} and improve your business performance.",
            ],
        ];
    }
}
