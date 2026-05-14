<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pv_documents', function (Blueprint $table) {
            $table->foreignId('academic_year_id')->nullable()->after('academic_year')->constrained('academic_years')->nullOnDelete();
            $table->foreignId('filiere_id')->nullable()->after('filiere')->constrained('filieres')->nullOnDelete();
            $table->foreignId('training_group_id')->nullable()->after('groupe')->constrained('training_groups')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('pv_documents', function (Blueprint $table) {
            $table->dropForeign(['academic_year_id']);
            $table->dropForeign(['filiere_id']);
            $table->dropForeign(['training_group_id']);
            $table->dropColumn(['academic_year_id', 'filiere_id', 'training_group_id']);
        });
    }
};
