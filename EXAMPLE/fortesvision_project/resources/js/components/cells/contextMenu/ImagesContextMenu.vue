<template>
    <div>
        <div
            v-if="showContextMenuFlag"
            class="context-menu"
            :style="{ top: contextMenuPosition.y + 'px', left: contextMenuPosition.x + 'px' }"
            @click.stop
        >
            <div class="context-menu-header">Cells actions</div>
            <div class="context-menu-items">
                <template v-if="selectedStatus">
                    <div class="context-menu-item" @click="colorSelectedCells">
                        <i class="pi pi-palette"></i>
                        <span>Fill in "{{ selectedStatus.name }}"</span>
                    </div>
                </template>
                <div v-if="hasSelectedCellsWithStatus && !isSelectedGroupCompleted && !hasDelayInSelection"
                     class="context-menu-item"
                     @click="completeSelectedCellsTask">
                    <i class="pi pi-check"></i>
                    <span>Complete the task</span>
                </div>
                <div class="context-menu-item" @click="clearSelection">
                    <i class="pi pi-times"></i>
                    <span>Remove selection</span>
                </div>
                <div class="context-menu-item" @click="clearSelectedCellsColor">
                    <i class="pi pi-trash"></i>
                    <span>Clear color</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

// Текущий видимый диапазон дат (как в ImagesCalendar)
const allDatesInThreeMonths = computed(() => store.getters['calendar/allDatesInThreeMonths'])

// Получаем состояние контекстного меню из хранилища
const showContextMenuFlag = computed(() => store.getters['ui/contextMenu/images/showContextMenu']);
const contextMenuPosition = computed(() => store.getters['ui/contextMenu/images/contextMenuPosition']);

// Получаем выбранный статус
const selectedStatus = computed(() => store.getters['statuses/selectedStatus']);

// Проверяем, есть ли у выделенных ячеек статус
const hasSelectedCellsWithStatus = computed(() =>
    store.getters['coloredCells/hasSelectedCellsWithStatus']
);

// Проверяем, завершена ли группа выделенных ячеек
const isSelectedGroupCompleted = computed(() =>
    store.getters['coloredCells/isSelectedGroupCompleted']
);

// Скрывать завершение, если выделение содержит Delay
const hasDelayInSelection = computed(() => {
    const delayStatusGetter = store.getters['statuses/delayStatus']
    const delayStatus = typeof delayStatusGetter === 'function' ? delayStatusGetter() : null
    const delayStatusId = delayStatus ? delayStatus.id : null
    if (!delayStatusId) return false
    const cells = store.state.coloredCells.cellsByKey || {}
    const selectedKeys = store.state.coloredCells.selectedKeys || new Set()
    for (const key of selectedKeys) {
        const cell = cells[key]
        if (cell && cell.statusId === delayStatusId) return true
    }
    return false
});

// Обработчик для закрытия меню при клике вне его
const handleOutsideClick = (event) => {
    if (showContextMenuFlag.value) {
        store.dispatch('ui/contextMenu/images/hideContextMenu');
    }
};

// Монтирование и размонтирование обработчика событий
onMounted(() => {
    document.addEventListener('click', handleOutsideClick);
});

onBeforeUnmount(() => {
    document.removeEventListener('click', handleOutsideClick);
});

// Методы для действий в контекстном меню
const colorSelectedCells = async () => {
    const selectedStatusValue = selectedStatus.value
    if (!selectedStatusValue) return

    // Собираем выбранные ключи из стора coloredCells
    const items = []
    const selectedKeys = store.state.coloredCells.selectedKeys
    for (const key of selectedKeys) {
        const [projectId, batchId, imageId, date] = key.split(':')
        items.push({
            project_id: Number(projectId),
            batch_id: Number(batchId),
            image_id: Number(imageId),
            date,
            status_id: selectedStatusValue.id,
        })
    }
    if (items.length === 0) return
    store.commit('coloredCells/clearSelection');
    await store.dispatch('ui/contextMenu/images/hideContextMenu');
    await store.dispatch('coloredCells/bulkColor', { items });
};

const completeSelectedCellsTask = async () => {
    // Собираем выделенные ключи
    const selectedKeys = Array.from(store.state.coloredCells.selectedKeys || [])
    if (!selectedKeys.length) return

    // Вспомогательные утилиты для дат (UTC, формат YYYY-MM-DD)
    const toIso = (date) => {
        try {
            if (!date) return date
            if (typeof date === 'string') return date.split('T')[0]
            const d = new Date(date)
            return isNaN(d.getTime()) ? date : d.toISOString().split('T')[0]
        } catch (e) { return date }
    }
    const shiftIso = (iso, deltaDays) => {
        try {
            const [y, m, d] = toIso(iso).split('-').map(Number)
            const dt = new Date(Date.UTC(y, m - 1, d))
            dt.setUTCDate(dt.getUTCDate() + deltaDays)
            const y2 = dt.getUTCFullYear()
            const m2 = String(dt.getUTCMonth() + 1).padStart(2, '0')
            const d2 = String(dt.getUTCDate()).padStart(2, '0')
            return `${y2}-${m2}-${d2}`
        } catch (e) { return toIso(iso) }
    }

    const isWeekend = (iso) => {
        try {
            const [y, m, d] = toIso(iso).split('-').map(Number)
            const dt = new Date(Date.UTC(y, m - 1, d))
            const day = dt.getUTCDay() // 0-вс, 6-сб
            return day === 0 || day === 6
        } catch (e) { return false }
    }
    const prevWorkday = (iso) => {
        let cur = shiftIso(iso, -1)
        let guard = 0
        while (isWeekend(cur) && guard < 10) { cur = shiftIso(cur, -1); guard++ }
        return cur
    }
    const nextWorkday = (iso) => {
        let cur = shiftIso(iso, 1)
        let guard = 0
        while (isWeekend(cur) && guard < 10) { cur = shiftIso(cur, 1); guard++ }
        return cur
    }

    // Получим id статуса Delay, чтобы его не завершать
    const delayStatusGetter = store.getters['statuses/delayStatus']
    const delayStatus = typeof delayStatusGetter === 'function' ? delayStatusGetter() : null
    const delayStatusId = delayStatus ? delayStatus.id : null

    // Построим карту по строкам (project:batch:image) -> выбранные даты
    const byRow = new Map()
    for (const key of selectedKeys) {
        const [projectId, batchId, imageId, date] = key.split(':')
        const rowKey = `${projectId}:${batchId}:${imageId}`
        if (!byRow.has(rowKey)) byRow.set(rowKey, new Set())
        byRow.get(rowKey).add(toIso(date))
    }

    // Доступ к клеткам стора
    const cells = store.state.coloredCells.cellsByKey || {}

    // Для каждой строки расширяем каждую выбранную дату до непрерывной группы одинакового статуса
    const items = []
    // Запомним правые границы завершённых групп, чтобы удалить примыкающие Delay
    const rightEdges = new Set()
    for (const [rowKey, selectedDatesSet] of byRow.entries()) {
        const [pId, bId, iId] = rowKey.split(':').map(Number)
        const selectedDates = Array.from(selectedDatesSet).sort()

        for (const sel of selectedDates) {
            const baseKey = `${rowKey}:${sel}`
            const baseCell = cells[baseKey]
            if (!baseCell || !baseCell.statusId) continue
            if (delayStatusId && baseCell.statusId === delayStatusId) continue // не завершаем Delay

            const statusId = baseCell.statusId

            // Расширяем влево (через выходные)
            let left = sel
            while (true) {
                const cand = prevWorkday(left)
                const ck = `${rowKey}:${cand}`
                const c = cells[ck]
                if (!c || c.statusId !== statusId) break
                left = cand
            }

            // Расширяем вправо (через выходные)
            let right = sel
            while (true) {
                const cand = nextWorkday(right)
                const ck = `${rowKey}:${cand}`
                const c = cells[ck]
                if (!c || c.statusId !== statusId) break
                right = cand
            }

            // Собираем рабочие даты от left до right включительно, пропуская выходные
            let cursor = left
            while (true) {
                const ck = `${rowKey}:${cursor}`
                const c = cells[ck]
                if (c && c.statusId === statusId) {
                    items.push({
                        project_id: pId,
                        batch_id: bId,
                        image_id: iId,
                        date: cursor,
                        status_id: statusId,
                        completed: true,
                    })
                }
                if (cursor === right) break
                cursor = nextWorkday(cursor)
            }

            // Сохраним правую границу этой завершённой группы
            rightEdges.add(`${rowKey}:${right}`)
        }
    }

    if (!items.length) return

    // Уберём дубли на случай пересечения групп
    const uniq = new Map()
    for (const it of items) {
        const k = `${it.project_id}:${it.batch_id}:${it.image_id}:${toIso(it.date)}`
        uniq.set(k, it)
    }

    const finalized = Array.from(uniq.values())
    await store.dispatch('coloredCells/bulkColor', { items: finalized })

    // Удаляем прилегающие справа Delay-дни, относящиеся к только что завершённым группам
    let delayDeleted = false
    if (delayStatusId && rightEdges.size > 0) {
        const delayDelete = []
        for (const edge of rightEdges) {
            const [pIdStr, bIdStr, iIdStr, rightIso] = edge.split(':')
            const pId = Number(pIdStr)
            const bId = Number(bIdStr)
            const iId = Number(iIdStr)
            let cur = nextWorkday(rightIso)
            // Идём по рабочим дням, пока подряд идут Delay
            while (true) {
                const ck = `${pIdStr}:${bIdStr}:${iIdStr}:${cur}`
                const c = cells[ck]
                if (!c || c.statusId !== delayStatusId) break
                delayDelete.push({
                    project_id: pId,
                    batch_id: bId,
                    image_id: iId,
                    date: cur,
                })
                cur = nextWorkday(cur)
            }
        }
        if (delayDelete.length > 0) {
            await store.dispatch('coloredCells/bulkDelete', { items: delayDelete })
            delayDeleted = true
        }
    }

    // Обновляем дилеи точечно: пересчитываем только по затронутым изображениям
    try {
        const affectedImageKeys = new Set(finalized.map(it => `${it.project_id}:${it.batch_id}:${it.image_id}`))
        const dates = allDatesInThreeMonths.value || []
        if (affectedImageKeys.size && dates.length >= 2) {
            const from = (() => {
                try { return new Date(dates[0]).toISOString().split('T')[0] } catch (e) { return dates[0] }
            })()
            const to = (() => {
                try { return new Date(dates[dates.length - 1]).toISOString().split('T')[0] } catch (e) { return dates[dates.length - 1] }
            })()
            await Promise.all(Array.from(affectedImageKeys).map(async (ik) => {
                const [pId, bId, iId] = ik.split(':').map(Number)
                const action = delayDeleted ? 'coloredCells/fetchByImageAndPeriodWithDelay' : 'coloredCells/fetchByImageAndPeriodWithDelay'
                await store.dispatch(action, {
                    projectId: pId,
                    batchId: bId,
                    imageId: iId,
                    from,
                    to,
                })
            }))
        }
    } catch (e) {
        // no-op: обновление визуальное, не критично
    }

    await store.dispatch('ui/contextMenu/images/hideContextMenu')
    store.commit('coloredCells/clearSelection')
};

const clearSelection = async () => {
    await store.dispatch('coloredCells/clearSelection')
    await store.dispatch('ui/contextMenu/images/hideContextMenu')
};

const clearSelectedCellsColor = async () => {
    const selectedKeys = store.state.coloredCells.selectedKeys
    if (!selectedKeys || selectedKeys.size === 0) return

    // Определим Delay статус
    const delayStatusGetter = store.getters['statuses/delayStatus']
    const delayStatus = typeof delayStatusGetter === 'function' ? delayStatusGetter() : null
    const delayStatusId = delayStatus ? delayStatus.id : null

    const cells = store.state.coloredCells.cellsByKey || {}

    const delayItems = []
    const taskItems = []
    const affectedImageKeys = new Set()
    for (const key of selectedKeys) {
        const [projectId, batchId, imageId, date] = key.split(':')
        const cell = cells[key]
        const composite = {
            project_id: Number(projectId),
            batch_id: Number(batchId),
            image_id: Number(imageId),
            date,
        }
        affectedImageKeys.add(`${projectId}:${batchId}:${imageId}`)
        if (cell && delayStatusId && cell.statusId === delayStatusId) {
            // Delay удаляем, чтобы сервер сдвинул задачи назад
            delayItems.push(composite)
        } else {
            // Не пропускаем выходные — пользователь ожидает возможность удалить все клетки
            taskItems.push(composite)
        }
    }

    // Сначала удаляем Delay (сдвиг назад выполнит сервер), затем обычные задачи
    if (delayItems.length > 0) {
        await store.dispatch('coloredCells/bulkDelete', { items: delayItems })
    }
    if (taskItems.length > 0) {
        await store.dispatch('coloredCells/bulkDelete', { items: taskItems })
    }

    // Перезагрузка только затронутых изображений
    try {
        const dates = allDatesInThreeMonths.value || []
        if (affectedImageKeys.size && dates.length >= 2) {
            const from = (() => {
                try { return new Date(dates[0]).toISOString().split('T')[0] } catch (e) { return dates[0] }
            })()
            const to = (() => {
                try { return new Date(dates[dates.length - 1]).toISOString().split('T')[0] } catch (e) { return dates[dates.length - 1] }
            })()
            const hadDelayDeletions = delayItems.length > 0
            await Promise.all(Array.from(affectedImageKeys).map(async (ik) => {
                const [pId, bId, iId] = ik.split(':').map(Number)
                const action = hadDelayDeletions ? 'coloredCells/fetchByImageAndPeriodWithDelay' : 'coloredCells/fetchByImageAndPeriod'
                await store.dispatch(action, {
                    projectId: pId,
                    batchId: bId,
                    imageId: iId,
                    from,
                    to,
                })
            }))
        }
    } catch (e) {
        // no-op
    }
};
</script>

<style scoped>
.context-menu {
    position: fixed;
    background-color: #ffffff;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    min-width: 180px;
    z-index: 1000;
    overflow: hidden;
}

.context-menu-header {
    padding: 8px 12px;
    background-color: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
    font-weight: 500;
    font-size: 14px;
    color: #495057;
}

.context-menu-items {
    padding: 4px 0;
}

.context-menu-item {
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: background-color 0.2s;
    user-select: none;
}

.context-menu-item:hover {
    background-color: #f1f3f5;
}

.context-menu-item i {
    font-size: 16px;
    color: #6c757d;
    width: 16px;
    text-align: center;
}

.context-menu-item:hover i {
    color: #495057;
}

/* Дополнительные стили для PrimeVue */
:deep(.p-dialog-header) {
    border-bottom: 1px solid #e9ecef;
}

:deep(.p-dialog-footer) {
    border-top: 1px solid #e9ecef;
    padding-top: 1rem;
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
}

.p-field {
    margin-bottom: 1.5rem;
}

.p-field label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
}

.w-full {
    width: 100%;
}
</style>
