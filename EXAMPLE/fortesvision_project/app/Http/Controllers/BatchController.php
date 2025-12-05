<?php

namespace App\Http\Controllers;

use App\Models\Batch;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BatchController extends Controller
{
    public function index(): JsonResponse
    {
        $batches = Batch::with(['project', 'images.users', 'users'])->get();
        
        return response()->json([
            'success' => true,
            'data' => $batches
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'project_id' => 'required|exists:projects,id'
        ]);

        $batch = Batch::create($validated);

        return response()->json([
            'success' => true,
            'data' => $batch->load(['project', 'images.users', 'users'])
        ], 201);
    }

    public function show(Batch $batch): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $batch->load(['project', 'images.users', 'users'])
        ]);
    }

    public function update(Request $request, Batch $batch): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'project_id' => 'sometimes|required|exists:projects,id'
        ]);

        $batch->update($validated);

        return response()->json([
            'success' => true,
            'data' => $batch->load(['project', 'images.users', 'users'])
        ]);
    }

    public function destroy(Batch $batch): JsonResponse
    {
        $batch->delete();

        return response()->json([
            'success' => true,
            'message' => 'Batch deleted successfully'
        ]);
    }

    public function byProject(Project $project): JsonResponse
    {
        $batches = $project->batches()->with(['images.users', 'users'])->get();
        
        return response()->json([
            'success' => true,
            'data' => $batches
        ]);
    }
} 