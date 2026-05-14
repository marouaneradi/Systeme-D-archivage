<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic_years', function (Blueprint $table) {
            $table->id();
            $table->integer('year')->unique();
            $table->string('label', 20);
            $table->enum('status', ['draft', 'active', 'archived'])->default('draft');
            $table->timestamps();
        });

        Schema::create('sectors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->string('name', 150);
            $table->timestamps();

            $table->unique(['academic_year_id', 'name']);
        });

        Schema::create('levels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->string('code', 20);
            $table->string('name', 150)->nullable();
            $table->integer('order_value')->nullable();
            $table->timestamps();

            $table->unique(['academic_year_id', 'code']);
        });

        Schema::create('filieres', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->foreignId('sector_id')->constrained('sectors')->restrictOnDelete();
            $table->foreignId('level_id')->constrained('levels')->restrictOnDelete();
            $table->string('code', 80);
            $table->string('name', 200);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(['academic_year_id', 'code']);
        });

        Schema::create('creneaux', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->string('code', 20);
            $table->string('name', 100)->nullable();
            $table->integer('order_value')->nullable();
            $table->timestamps();

            $table->unique(['academic_year_id', 'code']);
        });

        Schema::create('training_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->foreignId('filiere_id')->constrained('filieres')->restrictOnDelete();
            $table->foreignId('creneau_id')->constrained('creneaux')->restrictOnDelete();
            $table->string('code', 50);
            $table->string('name', 150)->nullable();
            $table->integer('capacity')->nullable();
            $table->enum('status', ['active', 'inactive', 'archived'])->default('active');
            $table->timestamps();

            $table->unique(['academic_year_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('training_groups');
        Schema::dropIfExists('creneaux');
        Schema::dropIfExists('filieres');
        Schema::dropIfExists('levels');
        Schema::dropIfExists('sectors');
        Schema::dropIfExists('academic_years');
    }
};
