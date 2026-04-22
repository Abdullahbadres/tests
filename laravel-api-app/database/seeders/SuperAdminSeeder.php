<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class SuperAdminSeeder extends Seeder
{
    /**
     * Default super admin account (only super_admin role from this seeder).
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
