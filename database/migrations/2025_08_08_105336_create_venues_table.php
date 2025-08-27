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
        Schema::create('venues', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('short')->nullable();
            $table->string('photo')->nullable();
            $table->text('description')->nullable();
            $table->string('dimension_m')->nullable();
            $table->string('dimension_f')->nullable();
            $table->integer('setup_banquet')->nullable();
            $table->integer('setup_classroom')->nullable();
            $table->integer('setup_theater')->nullable();
            $table->integer('setup_reception')->nullable();
            $table->string('floor_plan')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('venues');
    }
};
