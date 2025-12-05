<?php

namespace App\Http\Controllers;

use App\Models\Image;
use App\Models\Batch;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ImagesController extends Controller
{
    public function index(): JsonResponse
    {
        $images = Image::with(['batch.project', 'users'])->get();

        return response()->json([
            'success' => true,
            'data' => $images
        ]);
    }

    public function store(Request $request, Batch $batch): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'users' => 'sometimes|array',
            'users.*' => 'exists:users,id'
        ]);

        $image = Image::create([
            'name' => $validated['name'],
            'batch_id' => $batch->id
        ]);

        // Привязываем пользователей к изображению, если они переданы
        if (isset($validated['users']) && !empty($validated['users'])) {
            $attachData = [];
            foreach ($validated['users'] as $userId) {
                $attachData[$userId] = ['role' => 'artist']; // По умолчанию роль artist
            }
            $image->users()->attach($attachData);
        }

        return response()->json([
            'success' => true,
            'data' => $image->load(['batch.project', 'users'])
        ], 201);
    }

    public function show(Request $request, $projectId, $batchId, $imageId): JsonResponse
    {
        $image = Image::where('id', $imageId)
                     ->whereHas('batch', function($query) use ($projectId, $batchId) {
                         $query->where('id', $batchId)
                               ->where('project_id', $projectId);
                     })
                     ->with(['batch.project', 'users'])
                     ->first();

        if (!$image) {
            return response()->json([
                'success' => false,
                'message' => 'Image not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $image
        ]);
    }

    public function update(Request $request, $projectId, $batchId, $imageId): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'users' => 'sometimes|array',
            'users.*' => 'exists:users,id'
        ]);

        $image = Image::where('id', $imageId)
            ->whereHas('batch', function ($query) use ($projectId, $batchId) {
                $query->where('id', $batchId)
                    ->where('project_id', $projectId);
            })
            ->with(['users', 'batch.project'])
            ->first();

        if (!$image) {
            return response()->json([
                'success' => false,
                'message' => 'Image not found'
            ], 404);
        }

        // Обновление имени
        if (array_key_exists('name', $validated)) {
            $image->name = $validated['name'];
        }

        $image->save();

        // Синхронизация пользователей (если переданы)
        if (array_key_exists('users', $validated)) {
            $syncData = [];
            foreach (($validated['users'] ?? []) as $userId) {
                // Поддержим простой случай: все роли artist (клиентская форма хранит роли отдельно, но API ждёт ids)
                $syncData[$userId] = ['role' => 'artist'];
            }
            $image->users()->sync($syncData);
        }

        return response()->json([
            'success' => true,
            'data' => $image->fresh(['batch.project', 'users'])
        ]);
    }

    public function destroy(Request $request, $projectId, $batchId, $imageId): JsonResponse
    {
        $image = Image::where('id', $imageId)
                     ->whereHas('batch', function($query) use ($projectId, $batchId) {
                         $query->where('id', $batchId)
                               ->where('project_id', $projectId);
                     })
                     ->first();

        if (!$image) {
            return response()->json([
                'success' => false,
                'message' => 'Image not found'
            ], 404);
        }

        $image->delete();

        return response()->json([
            'success' => true,
            'message' => 'Image deleted successfully'
        ]);
    }

    public function byBatch(Batch $batch): JsonResponse
    {
        $images = $batch->images()->with(['users'])->get();

        return response()->json([
            'success' => true,
            'data' => $images
        ]);
    }
}
