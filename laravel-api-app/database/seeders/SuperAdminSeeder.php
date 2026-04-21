<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class SuperAdminSeeder extends Seeder
{
    /**
     * Akun super admin default (satu-satunya role super_admin dari seed).
     */
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'superadmin@mail.com'],
            [
                'name' => 'super admin',
                'password' => 'administratorSuper.0',
                'role' => 'super_admin',
            ],
        );
    }
}
