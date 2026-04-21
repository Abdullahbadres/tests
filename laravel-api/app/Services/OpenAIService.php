<?php

namespace App\Services;

use OpenAI\Laravel\Facades\OpenAI;

class OpenAIService
{
    public function generateFullPage(array $input): array
    {
        $response = OpenAI::chat()->create([
            'model' => config('services.openai.model', 'gpt-4o'),
            'max_tokens' => (int) config('services.openai.max_tokens', 4000),
            'messages' => [
                ['role' => 'system', 'content' => $this->buildSystemPrompt()],
                ['role' => 'user', 'content' => $this->buildUserPrompt($input)],
            ],
        ]);

        $content = $response->choices[0]->message->content ?? '{}';
        return json_decode($content, true) ?? [];
    }

    public function regenerateSection(array $input, string $section, array $currentContent): array
    {
        $prompt = "Regenerate only section '{$section}' in valid JSON key-value format.";
        $response = OpenAI::chat()->create([
            'model' => config('services.openai.model', 'gpt-4o'),
            'max_tokens' => 800,
            'messages' => [
                ['role' => 'system', 'content' => $this->buildSystemPrompt()],
                ['role' => 'user', 'content' => json_encode(compact('input', 'section', 'currentContent', 'prompt'))],
            ],
        ]);

        $newSection = json_decode($response->choices[0]->message->content ?? '{}', true) ?? [];
        return array_merge($currentContent, $newSection);
    }

    private function buildSystemPrompt(): string
    {
        return "You are an elite conversion copywriter. Return only valid JSON.";
    }

    private function buildUserPrompt(array $input): string
    {
        return "Generate a complete sales page JSON from this input: " . json_encode($input);
    }
}
