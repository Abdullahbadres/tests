<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LoginController extends Controller
{
    public function __invoke(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if (! Auth::attempt($credentials)) {
            /** 401 = salah email/password; 422 hanya untuk validasi input. */
            return response()->json(['message' => 'Invalid email or password.'], 401);
        }

        $request->session()->regenerate();
        return response()->json(['user' => auth()->user(), 'message' => 'Logged in']);
    }
}
