<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class UsersController extends Controller
{
    public function index()
    {
        $users = DB::table('users')
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    public function getByRole(Request $request)
    {
        $role = $request->get('role');
        $page = $request->get('page', 1);
        $limit = $request->get('limit', 10);
        $search = $request->get('search', '');
        $offset = ($page - 1) * $limit;

        $query = DB::table('users');

        // Если роль не "all" и не пустая, фильтруем по роли
        if ($role && $role !== 'all') {
            $query->where('role', $role);
        }

        // Добавляем поиск если передан параметр search
        if (!empty($search)) {
            $searchTerm = '%' . $search . '%';
            $query->where(function($q) use ($searchTerm) {
                $q->where('name', 'LIKE', $searchTerm); // Если есть поле email
                // Можете добавить другие поля для поиска:
                // ->orWhere('phone', 'LIKE', $searchTerm)
                // ->orWhere('company', 'LIKE', $searchTerm)
            });
        }

        // Добавляем сортировку для стабильного порядка при пагинации
        $query->orderBy('id', 'asc');

        $users = $query->offset($offset)
            ->limit($limit)
            ->get();

        return response()->json($users);
    }


    public function getById($id)
    {
        $user = DB::table('users')->where('id', $id)->first();

        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        return response()->json($user);
    }

    public function create(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'role' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        $userId = DB::table('users')->insertGetId([
            'name' => $request->name,
            'role' => $request->role,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $user = DB::table('users')->where('id', $userId)->first();

        return response()->json($user, 201);
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'role' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        $affected = DB::table('users')
            ->where('id', $id)
            ->update([
                'name' => $request->name,
                'role' => $request->role,
                'updated_at' => now(),
            ]);

        if ($affected === 0) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $user = DB::table('users')->where('id', $id)->first();

        return response()->json($user);
    }

    public function delete($id)
    {
        $affected = DB::table('users')->where('id', $id)->delete();

        if ($affected === 0) {
            return response()->json(['error' => 'User not found'], 404);
        }

        return response()->json(['message' => 'User deleted successfully']);
    }
}
