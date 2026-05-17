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
        // Update ENUM for type
        DB::statement("ALTER TABLE pv_documents MODIFY COLUMN type ENUM('PV_FF', 'PV_CC', 'PV_EFM', 'PV_PASSAGE', 'PV_INTERMEDIAIRE') NOT NULL");

        Schema::table('pv_documents', function (Blueprint $table) {
            $table->decimal('eff_grade', 5, 2)->nullable()->after('notes');
            $table->decimal('final_year_grade', 5, 2)->nullable()->after('eff_grade');
            $table->decimal('general_average', 5, 2)->nullable()->after('final_year_grade');
            $table->string('final_decision', 100)->nullable()->after('general_average');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pv_documents', function (Blueprint $table) {
            $table->dropColumn(['eff_grade', 'final_year_grade', 'general_average', 'final_decision']);
        });

        // Revert ENUM
        DB::statement("ALTER TABLE pv_documents MODIFY COLUMN type ENUM('PV_FF', 'PV_CC', 'PV_EFM') NOT NULL");
    }
};
