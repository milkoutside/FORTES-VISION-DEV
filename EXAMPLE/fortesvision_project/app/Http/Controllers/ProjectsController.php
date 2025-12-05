<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Batch;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ProjectsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $page = $request->get('page', 1);
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search', '');
        $userIds = $request->get('user_ids', []);

        $query = Project::with(['batches.images.users', 'users']);

        // Поиск по названию проекта или клиенту
        if (!empty($search)) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'LIKE', '%' . $search . '%')
                  ->orWhere('clientName', 'LIKE', '%' . $search . '%');
            });
        }

        // Фильтрация по пользователям
        if (!empty($userIds)) {
            $query->whereHas('users', function($q) use ($userIds) {
                $q->whereIn('users.id', $userIds);
            });
        }

        $projects = $query->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'success' => true,
            'data' => $projects->items(),
            'pagination' => [
                'current_page' => $projects->currentPage(),
                'last_page' => $projects->lastPage(),
                'per_page' => $projects->perPage(),
                'total' => $projects->total()
            ]
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'isActive' => 'boolean',
            'nextBatchId' => 'integer|min:1',
            'endDate' => 'nullable|date',
            'startDate' => 'nullable|date',
            'clientName' => 'nullable|string|max:255',
            'deadlineType' => 'in:soft,hard'
        ]);

        $project = Project::create($validated);

        return response()->json([
            'success' => true,
            'data' => $project->load(['batches.images.users', 'users'])
        ], 201);
    }

    public function show(Project $project): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $project->load(['batches.images.users', 'users'])
        ]);
    }

    public function update(Request $request, Project $project): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'isActive' => 'sometimes|boolean',
            'nextBatchId' => 'sometimes|integer|min:1',
            'endDate' => 'sometimes|nullable|date',
            'startDate' => 'sometimes|nullable|date',
            'clientName' => 'sometimes|nullable|string|max:255',
            'deadlineType' => 'sometimes|in:soft,hard',
            'users' => 'sometimes|array',
            'users.*' => 'integer|exists:users,id',
        ]);

        DB::transaction(function () use ($validated, $project, $request) {
            // Обновляем поля проекта
            $project->update(collect($validated)->except(['users'])->all());

            // Полная синхронизация пользователей проекта по переданному списку
            // Те, кого нет в массиве, будут отвязаны; новые будут добавлены с ролью freelancer
            if ($request->has('users')) {
                $selectedUserIds = collect($validated['users'] ?? [])->unique()->values();

                // Сохраняем роли для уже привязанных пользователей
                $existingUsers = $project->users()
                    ->whereIn('users.id', $selectedUserIds)
                    ->get()
                    ->keyBy('id');

                $syncData = [];
                foreach ($selectedUserIds as $userId) {
                    $existing = $existingUsers->get($userId);
                    $role = $existing ? $existing->pivot->role : 'freelancer';
                    $syncData[$userId] = ['role' => $role];
                }

                // Полностью заменить связи согласно списку
                $project->users()->sync($syncData);
            }
        });

        return response()->json([
            'success' => true,
            'data' => $project->load(['batches.images.users', 'users'])
        ]);
    }

    public function destroy(Project $project): JsonResponse
    {
        $project->delete();

        return response()->json([
            'success' => true,
            'message' => 'Project deleted successfully'
        ]);
    }

    public function attachUsers(Request $request, Project $project): JsonResponse
    {
        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
            'role' => 'required|in:modeller,freelancer,artist,art_director,project_manager'
        ]);

        $userIds = $validated['user_ids'];
        $role = $validated['role'];

        // Привязываем пользователей напрямую к проекту
        $attachData = [];
        foreach ($userIds as $userId) {
            $attachData[$userId] = ['role' => $role];
        }

        $project->users()->attach($attachData);

        return response()->json([
            'success' => true,
            'message' => 'Users attached successfully',
            'data' => $project->load(['batches.images.users', 'users'])
        ]);
    }

    public function getBatches(Project $project): JsonResponse
    {
        $batches = $project->batches()->with('images.users')->get();

        return response()->json([
            'success' => true,
            'data' => $batches
        ]);
    }

    public function createBatch(Request $request, Project $project): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255'
        ]);

        // Добавляем project_id в данные для создания
        $validated['project_id'] = $project->id;

        $batch = $project->batches()->create($validated);

        return response()->json([
            'success' => true,
            'data' => $batch->load('images.users')
        ], 201);
    }

    public function deleteBatch(Project $project, Batch $batch): JsonResponse
    {
        $batch->delete();

        return response()->json([
            'success' => true,
            'message' => 'Batch deleted successfully'
        ]);
    }
}
