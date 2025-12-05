<?php

use App\Http\Controllers\ImagesController;
use App\Http\Controllers\ColoredCellsController;
use App\Http\Controllers\ProjectsController;
use App\Http\Controllers\StatusesController;
use App\Http\Controllers\UsersController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
Route::prefix('users')->group(function () {
    Route::get('/', [UsersController::class, 'index']);
    Route::get('/role', [UsersController::class, 'getByRole']);
    Route::get('/{id}', [UsersController::class, 'getById']);
    Route::post('/', [UsersController::class, 'create']);
    Route::put('/{id}', [UsersController::class, 'update']);
    Route::delete('/{id}', [UsersController::class, 'delete']);
});
Route::prefix('statuses')->group(function () {
    // GET /api/statuses - список всех статусов
    Route::get('/', [StatusesController::class, 'index']);

    // POST /api/statuses - создание нового статуса
    Route::post('/', [StatusesController::class, 'store']);

    // GET /api/statuses/{id} - получение конкретного статуса
    Route::get('/{id}', [StatusesController::class, 'show']);

    // PUT/PATCH /api/statuses/{id} - обновление статуса
    Route::put('/{id}', [StatusesController::class, 'update']);
    Route::patch('/{id}', [StatusesController::class, 'update']);

    // DELETE /api/statuses/{id} - удаление статуса
    Route::delete('/{id}', [StatusesController::class, 'destroy']);
});
Route::apiResource('projects', ProjectsController::class);
Route::prefix('projects')->group(function () {
    Route::get('/{project}/batches', [ProjectsController::class, 'getBatches']);
    Route::post('/{project}/batches', [ProjectsController::class, 'createBatch']);
    Route::delete('/{project}/batches/{batch}', [ProjectsController::class, 'deleteBatch']);
    Route::post('/{project}/attach-users', [ProjectsController::class, 'attachUsers']);
    Route::get('/{project}/batches', [ProjectsController::class, 'getBatches']);
    Route::post('/{project}/batches', [ProjectsController::class, 'createBatch']);
    Route::delete('/{project}/batches/{batch}', [ProjectsController::class, 'deleteBatch']);
    Route::post('/{project}/attach-users', [ProjectsController::class, 'attachUsers']);
});
Route::get('/batches/{batch}/images', [ImagesController::class, 'byBatch']);
Route::post('/batches/{batch}/images', [ImagesController::class, 'store']);
Route::put('/projects/{project}/batches/{batch}/images/{image}', [ImagesController::class, 'update']);
Route::delete('/projects/{project}/batches/{batch}/images/{image}', [ImagesController::class, 'destroy']);

// Colored Cells
Route::prefix('colored-cells')->group(function () {
    // Массовое закрашивание
    Route::post('/bulk-color', [ColoredCellsController::class, 'bulkColor']);
    // Массовое удаление
    Route::post('/bulk-delete', [ColoredCellsController::class, 'bulkDelete']);
});

// Получение ячеек по изображению за период
Route::get('/projects/{project}/batches/{batch}/images/{image}/colored-cells', [ColoredCellsController::class, 'byImageAndPeriod']);
Route::get('/projects/{project}/batches/{batch}/images/{image}/colored-cells/delay', [ColoredCellsController::class, 'delayByImageAndPeriod']);
