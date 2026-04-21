<?php

use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\UserProfileController;
use App\Http\Controllers\SalesPageController;
use Illuminate\Support\Facades\Route;

Route::post('/register', RegisterController::class);
Route::post('/login', LoginController::class);
/** CSRF cookie: pakai route bawaan Sanctum di `/sanctum/csrf-cookie` (web), jangan duplikat di sini. */

Route::middleware(['auth:sanctum', 'super_admin'])->prefix('admin')->group(function () {
    Route::get('/users', [AdminUserController::class, 'index']);
    Route::post('/users', [AdminUserController::class, 'store']);
    Route::delete('/users/{user}', [AdminUserController::class, 'destroy']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', LogoutController::class);
    Route::get('/user', fn () => auth()->user());
    Route::patch('/user/profile', UserProfileController::class);

    Route::get('/sales-pages', [SalesPageController::class, 'index']);
    Route::post('/sales-pages', [SalesPageController::class, 'store']);
    Route::get('/sales-pages/{salesPage}', [SalesPageController::class, 'show']);
    Route::delete('/sales-pages/{salesPage}', [SalesPageController::class, 'destroy']);
    Route::post('/sales-pages/{salesPage}/generate', [SalesPageController::class, 'generate']);
    Route::put('/sales-pages/{salesPage}/regenerate-section', [SalesPageController::class, 'regenerateSection']);
    Route::get('/sales-pages/{salesPage}/export', [SalesPageController::class, 'export']);
    Route::post('/sales-pages/{salesPage}/email-proposal', [SalesPageController::class, 'sendProposalEmail']);
    Route::patch('/sales-pages/{salesPage}/template', [SalesPageController::class, 'updateTemplate']);
});
