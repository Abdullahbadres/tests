<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_pages', function (Blueprint $table) {
            $table->string('price_currency', 3)->default('USD');
            $table->string('display_currency', 3)->default('EUR');
            $table->string('converted_price_display', 64)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('sales_pages', function (Blueprint $table) {
            $table->dropColumn(['price_currency', 'display_currency', 'converted_price_display']);
        });
    }
};
