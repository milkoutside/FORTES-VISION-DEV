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
        Schema::table('users', function (Blueprint $table) {
            // Ускоряет выборки по роли и стабильную сортировку по id
            $table->index(['role', 'id'], 'users_role_id_index');
        });

        Schema::table('projects', function (Blueprint $table) {
            // Ускоряет orderBy('created_at', 'desc')
            $table->index('created_at', 'projects_created_at_index');
        });

        Schema::table('project_user', function (Blueprint $table) {
            // Быстрые обратные выборки всех проектов по пользователю
            $table->index('user_id', 'project_user_user_id_index');
        });

        Schema::table('batch_user', function (Blueprint $table) {
            // Быстрые обратные выборки всех батчей по пользователю
            $table->index('user_id', 'batch_user_user_id_index');
        });

        Schema::table('image_user', function (Blueprint $table) {
            // Быстрые обратные выборки всех изображений по пользователю
            $table->index('user_id', 'image_user_user_id_index');
        });

        Schema::table('colored_cells', function (Blueprint $table) {
            // Частые запросы: по проекту за период, по батчу за период
            $table->index(['project_id', 'date'], 'colored_cells_project_id_date_index');
            $table->index(['batch_id', 'date'], 'colored_cells_batch_id_date_index');
            $table->index(['project_id', 'batch_id', 'date'], 'colored_cells_project_id_batch_id_date_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('colored_cells', function (Blueprint $table) {
            $table->dropIndex('colored_cells_project_id_batch_id_date_index');
            $table->dropIndex('colored_cells_batch_id_date_index');
            $table->dropIndex('colored_cells_project_id_date_index');
        });

        Schema::table('image_user', function (Blueprint $table) {
            $table->dropIndex('image_user_user_id_index');
        });

        Schema::table('batch_user', function (Blueprint $table) {
            $table->dropIndex('batch_user_user_id_index');
        });

        Schema::table('project_user', function (Blueprint $table) {
            $table->dropIndex('project_user_user_id_index');
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->dropIndex('projects_created_at_index');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_role_id_index');
        });
    }
};


