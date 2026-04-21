<?php

return [
    /*
    |--------------------------------------------------------------------------
    | OpenAI API Key
    |--------------------------------------------------------------------------
    |
    | Used by openai-php/laravel facade (OpenAI::chat()).
    |
    */
    'api_key' => env('OPENAI_API_KEY'),

    /*
    |--------------------------------------------------------------------------
    | Optional Organization / Project
    |--------------------------------------------------------------------------
    */
    'organization' => env('OPENAI_ORGANIZATION'),
    'project' => env('OPENAI_PROJECT'),
];

