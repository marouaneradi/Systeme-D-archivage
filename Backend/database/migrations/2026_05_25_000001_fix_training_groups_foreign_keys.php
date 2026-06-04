<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('training_groups', function (Blueprint $table) {
            // Drop the old foreign keys with restrictOnDelete
            $table->dropForeign(['filiere_id']);
            $table->dropForeign(['creneau_id']);

            // Add new foreign keys with cascadeOnDelete
            $table->foreign('filiere_id')
                ->references('id')
                ->on('filieres')
                ->cascadeOnDelete();

            $table->foreign('creneau_id')
                ->references('id')
                ->on('creneaux')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('training_groups', function (Blueprint $table) {
            // Revert back to restrictOnDelete
            $table->dropForeign(['filiere_id']);
            $table->dropForeign(['creneau_id']);

            $table->foreign('filiere_id')
                ->references('id')
                ->on('filieres')
                ->restrictOnDelete();

            $table->foreign('creneau_id')
                ->references('id')
                ->on('creneaux')
                ->restrictOnDelete();
        });
    }
};
