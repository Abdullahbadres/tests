<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Rules\PasswordPolicyRule;
use Illuminate\Http\Request;
class AdminUserController extends Controller
{
    /**
     * Daftar semua user (read-only fields; tidak ada update role).
     */
    public function index(Request $request)
    {
        $paginator = User::query()
            ->orderBy('id')
            ->paginate(perPage: 20);

        return response()->json([
            'total_registered' => User::query()->count(),
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    /**
     * Buat user baru (selalu role user). Tidak bisa set super_admin dari sini.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', new PasswordPolicyRule],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => 'user',
        ]);

        return response()->json(['user' => $user], 201);
    }

    /**
     * Hapus user. Super admin tidak boleh menghapus dirinya sendiri.
     */
    public function destroy(Request $request, User $user)
    {
        if ((int) $user->id === (int) $request->user()->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 403);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted.']);
    }
}
