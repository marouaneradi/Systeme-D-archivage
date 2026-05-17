<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('pv_documents', function (Blueprint $table) {
            $table->dropColumn([
                'eff_grade',
                'final_year_grade',
                'general_average',
                'final_decision'
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pv_documents', function (Blueprint $table) {
            $table->decimal('eff_grade', 5, 2)->nullable();
            $table->decimal('final_year_grade', 5, 2)->nullable();
            $table->decimal('general_average', 5, 2)->nullable();
            $table->string('final_decision')->nullable();
        });
    }
};
