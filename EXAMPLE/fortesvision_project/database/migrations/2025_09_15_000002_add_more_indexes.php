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
        Schema::table('colored_cells', function (Blueprint $table) {
            $table->index(['image_id', 'date'], 'colored_cells_image_id_date_index');
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->index('isActive', 'projects_isActive_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropIndex('projects_isActive_index');
        });

        Schema::table('colored_cells', function (Blueprint $table) {
            $table->dropIndex('colored_cells_image_id_date_index');
        });
    }
};


