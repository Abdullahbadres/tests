<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_pages', function (Blueprint $table): void {
            $table->string('uom', 32)->default('unit')->after('price');
        });
    }

    public function down(): void
    {
        Schema::table('sales_pages', function (Blueprint $table): void {
            $table->dropColumn('uom');
        });
    }
};

