<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Rules\PasswordPolicyRule;
use Illuminate\Http\Request;

class UserProfileController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $user->name = $validated['name'];

        if ($request->filled('password')) {
            $request->validate([
                'current_password' => ['required', 'current_password'],
                'password' => ['required', 'confirmed', new PasswordPolicyRule],
            ]);
            $user->password = $request->input('password');
        }

        $user->save();

        return response()->json(['user' => $user->fresh()]);
    }
}
