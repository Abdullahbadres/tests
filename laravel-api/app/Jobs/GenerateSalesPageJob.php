<?php

namespace App\Jobs;

use App\Models\SalesPage;
use App\Services\OpenAIService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class GenerateSalesPageJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public SalesPage $salesPage)
    {
    }

    public function handle(OpenAIService $openAI): void
    {
        $this->salesPage->update(['status' => 'generating']);

        try {
            $content = $openAI->generateFullPage([
                'product_name' => $this->salesPage->product_name,
                'product_description' => $this->salesPage->product_description,
                'key_features' => $this->salesPage->key_features,
                'target_audience' => $this->salesPage->target_audience,
                'price' => $this->salesPage->price,
                'unique_selling_points' => $this->salesPage->unique_selling_points,
            ]);

            $this->salesPage->update([
                'generated_content' => $content,
                'status' => 'completed',
            ]);
        } catch (\Throwable $e) {
            $this->salesPage->update(['status' => 'failed']);
            throw $e;
        }
    }
}
