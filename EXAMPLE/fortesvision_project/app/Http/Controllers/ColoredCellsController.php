<?php

namespace App\Http\Controllers;

use App\Models\ColoredCell;
use App\Models\Status;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class ColoredCellsController extends Controller
{
    /**
     * Массовое закрашивание ячеек (upsert по уникальному ключу project/batch/image/date)
     */
    public function bulkColor(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'items' => ['required', 'array', 'min:1'],
            'items.*.project_id' => ['required', 'integer', 'exists:projects,id'],
            'items.*.batch_id' => ['required', 'integer', 'exists:batches,id'],
            'items.*.image_id' => ['required', 'integer', 'exists:images,id'],
            'items.*.status_id' => ['required', 'integer', 'exists:statuses,id'],
            'items.*.date' => ['required', 'date'],
            'items.*.completed' => ['sometimes', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $now = now();
        $rows = [];
        foreach ($request->input('items') as $item) {
            $rows[] = [
                'project_id' => (int) $item['project_id'],
                'batch_id' => (int) $item['batch_id'],
                'image_id' => (int) $item['image_id'],
                'status_id' => (int) $item['status_id'],
                'date' => $item['date'],
                'completed' => (bool) ($item['completed'] ?? false),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // upsert по уникальному ключу: project_id, batch_id, image_id, date
        ColoredCell::upsert(
            $rows,
            ['project_id', 'batch_id', 'image_id', 'date'],
            ['status_id', 'completed', 'updated_at']
        );

        // Вернём актуальные данные из БД
        $result = ColoredCell::query()
            ->where(function ($query) use ($rows) {
                foreach ($rows as $r) {
                    $query->orWhere(function ($q) use ($r) {
                        $q->where('project_id', $r['project_id'])
                            ->where('batch_id', $r['batch_id'])
                            ->where('image_id', $r['image_id'])
                            ->where('date', $r['date']);
                    });
                }
            })
            ->get();

        return response()->json([
            'message' => 'Cells colored successfully',
            'cells' => $result,
        ]);
    }

    /**
     * Массовое удаление ячеек по набору ключей
     */
    public function bulkDelete(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'items' => ['required', 'array', 'min:1'],
            'items.*.project_id' => ['required', 'integer', 'exists:projects,id'],
            'items.*.batch_id' => ['required', 'integer', 'exists:batches,id'],
            'items.*.image_id' => ['required', 'integer', 'exists:images,id'],
            'items.*.date' => ['required', 'date'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $items = $request->input('items');

        $deletedCount = ColoredCell::query()
            ->where(function ($query) use ($items) {
                foreach ($items as $r) {
                    $query->orWhere(function ($q) use ($r) {
                        $q->where('project_id', (int) $r['project_id'])
                            ->where('batch_id', (int) $r['batch_id'])
                            ->where('image_id', (int) $r['image_id'])
                            ->where('date', $r['date']);
                    });
                }
            })
            ->delete();

        return response()->json([
            'message' => 'Cells deleted successfully',
            'deleted' => $deletedCount,
        ]);
    }

    /**
     * Получение всех ячеек за период по конкретному изображению (в контексте проекта и батча)
     */
    public function byImageAndPeriod(int $projectId, int $batchId, int $imageId, Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $from = $request->input('from');
        $to = $request->input('to');

        $cells = ColoredCell::query()
            ->where('project_id', $projectId)
            ->where('batch_id', $batchId)
            ->where('image_id', $imageId)
            ->whereBetween('date', [$from, $to])
            ->orderBy('date')
            ->get();

        return response()->json([
            'cells' => $cells,
        ]);
    }
    public function delayByImageAndPeriod (int $projectId, int $batchId, int $imageId, Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $from = Carbon::parse($request->input('from'))->startOfDay();
        $to = Carbon::parse($request->input('to'))->endOfDay();

        // Найдём статусы Delay и Weekend
        $delayStatus = Status::query()->where('name', 'Delay')->first();
        $weekendStatus = Status::query()->where('name', 'Weekend')->first();
        if (!$delayStatus) {
            return response()->json([
                'message' => 'Status "Delay" not found',
            ], 404);
        }

        // Просрочка считается до сегодняшнего дня включительно
        $today = now()->startOfDay();

        // Берём все ячейки по изображению (для корректного построения групп и сдвигов)
        $allCells = ColoredCell::query()
            ->where('project_id', $projectId)
            ->where('batch_id', $batchId)
            ->where('image_id', $imageId)
            ->orderBy('date')
            ->get();

        if ($allCells->isEmpty()) {
            return response()->json([
                'cells' => [],
            ]);
        }

        // Построим группы, где одинаковый status_id объединяется через выходные дни
        $groups = [];
        $currentGroup = null;
        $prevNonWeekendDate = null; // последняя дата не-выходного дня, добавленная в текущую группу

        foreach ($allCells as $cell) {
            $cellDate = $cell->date instanceof Carbon ? $cell->date->copy()->startOfDay() : Carbon::parse($cell->date)->startOfDay();
            $isWeekendCell = $weekendStatus && (int) $cell->status_id === (int) $weekendStatus->id;

            // Игнорируем выходные при построении групп (они не разрывают группу)
            if ($isWeekendCell) {
                continue;
            }

            if ($currentGroup === null) {
                $currentGroup = [
                    'status_id' => (int) $cell->status_id,
                    'items' => [$cell],
                    'start' => $cellDate->copy(),
                    'end' => $cellDate->copy(),
                ];
                $prevNonWeekendDate = $cellDate->copy();
            } else {
                $sameStatus = (int) $cell->status_id === (int) $currentGroup['status_id'];

                // Следующий рабочий день после предыдущей не-выходной даты
                $nextWorkday = $prevNonWeekendDate ? $prevNonWeekendDate->copy()->addDay() : null;
                if ($nextWorkday) { while ($nextWorkday->isWeekend()) { $nextWorkday->addDay(); } }

                $isConsecutiveThroughWeekend = $nextWorkday !== null && $cellDate->equalTo($nextWorkday);

                if ($sameStatus && $isConsecutiveThroughWeekend) {
                    $currentGroup['items'][] = $cell;
                    $currentGroup['end'] = $cellDate->copy();
                } else {
                    // Закрываем предыдущую группу
                    $groups[] = $currentGroup;
                    // Начинаем новую
                    $currentGroup = [
                        'status_id' => (int) $cell->status_id,
                        'items' => [$cell],
                        'start' => $cellDate->copy(),
                        'end' => $cellDate->copy(),
                    ];
                }
                $prevNonWeekendDate = $cellDate->copy();
            }
        }
        if ($currentGroup !== null) {
            $groups[] = $currentGroup;
        }

        // Для каждой группы определим, завершена ли она полностью
        foreach ($groups as &$g) {
            $allCompleted = true;
            foreach ($g['items'] as $it) {
                if (!$it->completed) { $allCompleted = false; break; }
            }
            $g['completed'] = $allCompleted;
        }
        unset($g);

        // Находим САМУЮ РАННЮЮ незавершённую группу, которая закончилась до вчера
        // и у которой НЕТ впереди ни одной полностью завершённой группы
        $overdueIdx = null;
        for ($i = 0; $i < count($groups); $i++) {
            $g = $groups[$i];
            if ((int) $g['status_id'] === (int) $delayStatus->id) { continue; }
            if ($g['completed'] === true) { continue; }
            if (!$g['end']->lt($today)) { continue; }
            // Проверяем, есть ли впереди завершённая группа
            $hasCompletedAhead = false;
            for ($j = $i + 1; $j < count($groups); $j++) {
                if ($groups[$j]['completed'] === true) {
                    $hasCompletedAhead = true;
                    break;
                }
            }
            if ($hasCompletedAhead) {
                // По важному правилу для неё не считаем дилей
                continue;
            }
            $overdueIdx = $i;
            break; // берём самую раннюю подходящую
        }

        if ($overdueIdx === null) {
            // Нечего сдвигать/добавлять по правилам
            $cells = ColoredCell::query()
                ->where('project_id', $projectId)
                ->where('batch_id', $batchId)
                ->where('image_id', $imageId)
                ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
                ->orderBy('date')
                ->get();

            return response()->json([
                'cells' => $cells,
            ]);
        }

        $overdueGroup = $groups[$overdueIdx];
        $delayDays = $overdueGroup['end']->diffInDays($today);

        if ($delayDays <= 0) {
            $cells = ColoredCell::query()
                ->where('project_id', $projectId)
                ->where('batch_id', $batchId)
                ->where('image_id', $imageId)
                ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
                ->orderBy('date')
                ->get();

            return response()->json([
                'cells' => $cells,
            ]);
        }

        // Диапазон для вставки Delay: (end+1) .. сегодня
        $delayStart = $overdueGroup['end']->copy()->addDay();
        $delayEnd = $today->copy();

        // Идемпотентность: считаем, сколько Delay-дней уже существует, и сдвигаем только на дельту
        $desiredDelayDays = 0;
        if ($delayStart->lte($delayEnd)) {
            // включительно: количество дней в окне просрочки
            $desiredDelayDays = $delayStart->diffInDays($delayEnd) + 1;
        }

        $existingDelayDays = 0;
        if ($desiredDelayDays > 0) {
            $existingDelayDays = ColoredCell::query()
                ->where('project_id', $projectId)
                ->where('batch_id', $batchId)
                ->where('image_id', $imageId)
                ->where('status_id', $delayStatus->id)
                ->whereBetween('date', [$delayStart->toDateString(), $delayEnd->toDateString()])
                ->count();
        }

        $additionalDays = max(0, $desiredDelayDays - $existingDelayDays);

        DB::beginTransaction();
        try {
            // 1) Пересобираем расписание незавершённых задач слитным блоком по будням
            //    Начальная точка: первый рабочий день после окна просрочки
            $startCursor = $delayEnd->copy()->addDay();
            while ($startCursor->isWeekend()) { $startCursor->addDay(); }

            // Соберём все незавершённые НЕ-Delay ячейки после просрочки (в хронологическом порядке)
            $movables = ColoredCell::query()
                ->where('project_id', $projectId)
                ->where('batch_id', $batchId)
                ->where('image_id', $imageId)
                ->where('completed', false)
                ->where('status_id', '!=', $delayStatus->id)
                ->whereDate('date', '>=', $overdueGroup['end']->copy()->addDay()->toDateString())
                ->orderBy('date', 'asc')
                ->get(['id', 'date']);

            $cursor = $startCursor->copy();
            foreach ($movables as $row) {
                while ($cursor->isWeekend()) { $cursor->addDay(); }

                $rowDate = $row->date instanceof Carbon ? $row->date->copy()->startOfDay() : Carbon::parse($row->date)->startOfDay();
                $target = $cursor->copy();

                // Найдём ближайшую свободную рабочую дату.
                while (true) {
                    while ($target->isWeekend()) { $target->addDay(); }

                    $conflict = ColoredCell::query()
                        ->where('project_id', $projectId)
                        ->where('batch_id', $batchId)
                        ->where('image_id', $imageId)
                        ->whereDate('date', $target->toDateString())
                        ->first(['id', 'status_id']);

                    if (!$conflict) {
                        // Слот свободен
                        break;
                    }

                    if ((int) $conflict->id === (int) $row->id) {
                        // Это та же запись — можно оставить дату как есть
                        break;
                    }

                    if ((int) $conflict->status_id === (int) $delayStatus->id) {
                        // Удаляем Delay, чтобы освободить слот
                        ColoredCell::query()->where('id', $conflict->id)->delete();
                        break;
                    }

                    // Слот занят не-Delay — смещаем целевую дату вперёд
                    $target->addDay();
                }

                $newDate = $target->toDateString();
                if ($newDate !== $rowDate->toDateString()) {
                    ColoredCell::query()->where('id', $row->id)->update(['date' => $newDate]);
                }

                // Следующая дата
                $cursor = $target->copy()->addDay();
            }

            // 2) Вставляем Delay только в будние дни окна просрочки и только туда, где нет других ячеек
            if ($delayStart->lte($delayEnd)) {
                // Получим множество занятых дат, чтобы не перезаписывать существующие статусы (Weekend и др.)
                $occupied = ColoredCell::query()
                    ->where('project_id', $projectId)
                    ->where('batch_id', $batchId)
                    ->where('image_id', $imageId)
                    ->whereBetween('date', [$delayStart->toDateString(), $delayEnd->toDateString()])
                    ->pluck('date')
                    ->map(function ($d) { return Carbon::parse($d)->toDateString(); })
                    ->toArray();
                $occupiedSet = array_flip($occupied);

                $rows = [];
                $cursor = $delayStart->copy();
                while ($cursor->lte($delayEnd)) {
                    if (!$cursor->isWeekend()) {
                        $dateStr = $cursor->toDateString();
                        if (!isset($occupiedSet[$dateStr])) {
                            $rows[] = [
                                'project_id' => $projectId,
                                'batch_id' => $batchId,
                                'image_id' => $imageId,
                                'status_id' => $delayStatus->id,
                                'date' => $dateStr,
                                'completed' => false,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ];
                        }
                    }
                    $cursor->addDay();
                }

                if (!empty($rows)) {
                    ColoredCell::upsert(
                        $rows,
                        ['project_id', 'batch_id', 'image_id', 'date'],
                        ['status_id', 'completed', 'updated_at']
                    );
                }
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to apply delay logic',
                'error' => $e->getMessage(),
            ], 500);
        }

        // Возвращаем актуальные данные за указанный период
        $cells = ColoredCell::query()
            ->where('project_id', $projectId)
            ->where('batch_id', $batchId)
            ->where('image_id', $imageId)
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->orderBy('date')
            ->get();

        return response()->json([
            'cells' => $cells,
        ]);
    }
}
