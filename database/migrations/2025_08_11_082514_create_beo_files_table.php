<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('beo_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            $table->string('file_code')->unique();
            $table->string('file_path');
            $table->string('original_filename')->nullable();
            $table->integer('file_size')->nullable();
            $table->string('mime_type')->default('application/pdf');
            $table->json('metadata')->nullable(); // Store additional PDF info
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['order_id', 'created_at']);
            $table->index('file_code');
        });
    }

    public function down()
    {
        Schema::dropIfExists('beo_files');
    }
};