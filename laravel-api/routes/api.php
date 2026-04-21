<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\SalesPageController;
use Illuminate\Support\Facades\Route;

Route::post('/register', RegisterController::class);
Route::post('/login', LoginController::class);

Route::get('/sanctum/csrf-cookie', fn () => response()->json(['message' => 'CSRF cookie set']));

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', LogoutController::class);
    Route::get('/user', fn () => auth()->user());

    Route::get('/sales-pages', [SalesPageController::class, 'index']);
    Route::post('/sales-pages', [SalesPageController::class, 'store']);
    Route::get('/sales-pages/{salesPage}', [SalesPageController::class, 'show']);
    Route::delete('/sales-pages/{salesPage}', [SalesPageController::class, 'destroy']);
    Route::post('/sales-pages/{salesPage}/generate', [SalesPageController::class, 'generate']);
    Route::put('/sales-pages/{salesPage}/regenerate-section', [SalesPageController::class, 'regenerateSection']);
    Route::get('/sales-pages/{salesPage}/export', [SalesPageController::class, 'export']);
    Route::patch('/sales-pages/{salesPage}/template', [SalesPageController::class, 'updateTemplate']);
});
