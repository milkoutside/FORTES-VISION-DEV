<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatusesController extends Controller
{
    public function index()
    {
        $statuses = DB::table('statuses')->get();
        return response()->json($statuses);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'color' => 'required|string|max:7',
        ]);

        $id = DB::table('statuses')->insertGetId([
            'name' => $validated['name'],
            'color' => $validated['color'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $status = DB::table('statuses')->find($id);
        return response()->json($status, 201);
    }

    public function show($id)
    {
        $status = DB::table('statuses')->find($id);
        if (!$status) {
            return response()->json(['message' => 'Status not found'], 404);
        }
        return response()->json($status);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'color' => 'sometimes|string|max:7',
        ]);

        $affected = DB::table('statuses')
            ->where('id', $id)
            ->update([
                ...$validated,
                'updated_at' => now(),
            ]);

        if ($affected === 0) {
            return response()->json(['message' => 'Status not found'], 404);
        }

        $status = DB::table('statuses')->find($id);
        return response()->json($status);
    }

    public function destroy($id)
    {
        $affected = DB::table('statuses')->where('id', $id)->delete();

        if ($affected === 0) {
            return response()->json(['message' => 'Status not found'], 404);
        }

        return response()->json(null, 204);
    }
}
