<template>
    <div
        class="images-calendar-grid"
        @contextmenu.prevent
    >
        <VirtualScroller
            ref="virtualScroller"
            :items="virtualItems"
            :itemSize="BASE_ITEM_HEIGHT"
            class="images-virtual-container calendar-scroll"
            lazy
            scrollHeight="100%"
        >
            <template #item="{ item, index }">
                <!-- Строка проекта -->
                <div v-if="item.type === 'project'" class="project-cells-container">
                    <div
                        class="project-row empty-block"
                        :style="{ width: blockWidth }"
                        :data-project-id="item.data.id"
                        ref="projectRow"
                    >
                    </div>
                </div>
                <!-- Строка батча -->
                <div v-else-if="item.type === 'batch'" class="batch-container">
                    <div class="batch-cells-container">
                        <div
                            class="batch-row empty-block"
                            :style="{ width: blockWidth }"
                            :data-project-id="item.data.projectId"
                            :data-batch-id="item.data.id"
                            ref="batchRow"
                        >
                        </div>
                    </div>
                </div>
                <div v-else-if="item.type === 'empty'" class="batch-container">
                    <div class="batch-cells-container">
                        <div
                            class="empty-block"
                            :style="{ width: blockWidth }"
                        >
                        </div>
                    </div>
                </div>
                <!-- Строка изображения -->
                <div v-else-if="item.type === 'image'" class="image-container">
                    <div class="image-cells-container">
                        <div
                            class="image-row"
                            :data-project-id="item.data.projectId"
                            :data-batch-id="item.data.batchId"
                            :data-image-id="item.data.id"
                            ref="imageRow"
                        >
                            <div
                                v-for="(date, dateIndex) in allDatesInThreeMonths"
                                :key="`image-${item.data.id}-${date}`"
                                class="image-cell"
                                :class="{
                                    'selected': isCellSelected(date, item.data.projectId, item.data.batchId, item.data.id),
                                    'status-colored': getCellStatus(date, item.data.projectId, item.data.batchId, item.data.id, 'images')
                                }"
                                :style="getCellStyle(date, item.data.projectId, item.data.batchId, item.data.id, 'images')"
                                :data-date="date"
                                :data-date-index="dateIndex"
                                :data-project-id="item.data.projectId"
                                :data-batch-id="item.data.batchId"
                                :data-image-id="item.data.id"
                                :data-category="'images'"
                                @mousedown.left="onCellMouseDown($event)"
                                @mouseenter="onCellMouseEnter($event)"
                                @contextmenu.prevent="handleContextMenu($event, { date, projectId: item.data.projectId, batchId: item.data.batchId, imageId: item.data.id, category: 'images' })"
                            >
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </VirtualScroller>

        <ImagesContextMenu></ImagesContextMenu>
    </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useStore } from 'vuex'
import VirtualScroller from 'primevue/virtualscroller'

import axios from 'axios'
import ImagesContextMenu from "@/components/cells/contextMenu/ImagesContextMenu.vue";

const store = useStore()
const virtualScroller = ref(null)
const projectRow = ref([])
const batchRow = ref([])
const imageRow = ref([])

const BASE_ITEM_HEIGHT = window.innerHeight * 0.06 // 6vh в пикселях
const blockWidth = computed(() => `${allDatesInThreeMonths.value.length * 4}vw`);
// Данные из store
const filteredProjects = computed(() => {
    // Проверяем, есть ли активные фильтры
    const hasActiveFilters = store.getters['sidebar/filters/hasActiveFilters']
    const filteredProjectsFromStore = store.getters['sidebar/filters/filteredProjects']

    // Если есть активные фильтры - используем отфильтрованные проекты (даже если пустой массив)
    if (hasActiveFilters) {
        return filteredProjectsFromStore
    }

    // Иначе возвращаем все проекты
    return store.getters['projects/allProjects']
})
const allDatesInThreeMonths = computed(() => store.getters['calendar/allDatesInThreeMonths'])

// Функции для работы с проектами, батчами и изображениями
const getProjectBatches = (projectId) => store.getters['projects/getProjectBatches'](projectId)
const getBatchImages = (projectId, batchId) => store.getters['projects/getBatchImages'](projectId, batchId)

// Получаем состояние развернутых проектов и батчей для реактивности
// Используем getters для лучшей реактивности

// Создаем виртуальные элементы для VirtualScroller
const virtualItems = computed(() => {
    const items = []

    filteredProjects.value.forEach(project => {
        // Проверяем, развернут ли проект
        const isProjectExpanded = store.getters['projects/isProjectExpanded'](project.id)

            const batches = getProjectBatches(project.id)

            // Добавляем строку проекта
            items.push({
                type: 'project',
                data: project
            })
            if(isProjectExpanded) {
                // Добавляем строки батчей только если они развернуты и содержат изображения
                batches.forEach(batch => {
                    const isBatchExpanded = store.getters['projects/isBatchExpanded'](project.id, batch.id)
                    if (isBatchExpanded) {
                        items.push({
                            type: 'batch',
                            data: {
                                ...batch,
                                projectId: project.id
                            }
                        })
                        const images = getBatchImages(project.id, batch.id)

                        // Добавляем строки изображений
                        images.forEach(image => {
                            items.push({
                                type: 'image',
                                data: {
                                    ...image,
                                    projectId: project.id,
                                    batchId: batch.id
                                }
                            })
                        })
                    } else {
                        items.push({
                            type: 'empty'
                        })
                    }
                })
            }

    })
    return items
})


// Получение данных ячейки и статуса
const getCell = (date, projectId, batchId, imageId) => {
    return store.getters['coloredCells/getCell'](projectId, batchId, imageId, date)
}

const getStatusById = (statusId) => {
    const statuses = store.getters['statuses/allStatuses'] || []
    return statuses.find(s => s.id === statusId) || null
}

// Выделение ячеек
const isCellSelected = (date, projectId, batchId, imageId) => {
    return store.getters['coloredCells/isSelected'](projectId, batchId, imageId, date)
}

// Есть ли статус у ячейки
const getCellStatus = (date, projectId, batchId, imageId) => {
    const cell = getCell(date, projectId, batchId, imageId)
    return !!(cell && cell.statusId)
}

// Стиль ячейки на основе статуса
const getCellStyle = (date, projectId, batchId, imageId) => {
    const cell = getCell(date, projectId, batchId, imageId)

    // Определяем выходной день (суббота/воскресенье)
    const isWeekendDay = (() => {
        try {
            const d = new Date(date)
            const day = d.getDay() // 0 - вс, 6 - сб
            return day === 0 || day === 6
        } catch (e) {
            return false
        }
    })()

    // Получаем статусы Weekend и Delay из стора, если есть
    const weekendStatusGetter = store.getters['statuses/weekendStatus']
    const delayStatusGetter = store.getters['statuses/delayStatus']
    const weekendStatus = typeof weekendStatusGetter === 'function' ? weekendStatusGetter() : null
    const delayStatus = typeof delayStatusGetter === 'function' ? delayStatusGetter() : null

    const isEmptyCell = !cell || !cell.statusId
    const isDelayCell = !!(cell && cell.statusId && delayStatus && cell.statusId === delayStatus.id)

    // Если это выходной, и существует статус Weekend, и (ячейка пустая или в ней статус Delay) — красим как Weekend
    if (isWeekendDay && weekendStatus && (isEmptyCell || isDelayCell)) {
        return {
            backgroundColor: weekendStatus.color,
            color: weekendStatus.text_color || '#000000'
        }
    }

    // Стандартная логика окраски
    if (!cell || !cell.statusId) return {}
    const status = getStatusById(cell.statusId)
    if (!status) return {}
    return {
        backgroundColor: status.color,
        color: status.text_color || '#000000'
    }
}

// Показ контекстного меню
const handleContextMenu = (event, { date, projectId, batchId, imageId }) => {
    // Если ячейка не была выделена — выделим её одиночным выбором
    if (!isCellSelected(date, projectId, batchId, imageId)) {
        store.dispatch('coloredCells/clearSelection')
        const d = normalizeDate(date)
        store.dispatch('coloredCells/selectCellsByDescriptors', [{
            project_id: Number(projectId),
            batch_id: Number(batchId),
            image_id: Number(imageId),
            date: d,
        }])
        // Обновим якорь для дальнейшего Shift-выбора
        selectionAnchor.value = {
            project_id: Number(projectId),
            batch_id: Number(batchId),
            image_id: Number(imageId),
            date: d,
            dateIndex: allDatesInThreeMonths.value.findIndex(dt => normalizeDate(dt) === d),
        }
    }

    store.dispatch('ui/contextMenu/images/showContextMenu', {
        x: event.clientX,
        y: event.clientY,
        projectId,
        batchId,
        imageId
    })
}

onMounted(async () => {
    document.addEventListener('mouseup', onGlobalMouseUp)
    document.addEventListener('mousemove', onGlobalMouseMove, { passive: true })
})

onUnmounted(() => {
    document.removeEventListener('mouseup', onGlobalMouseUp)
    document.removeEventListener('mousemove', onGlobalMouseMove)
    stopAutoScroll()
})

// =========================
// Выделение как в Excel
// =========================
const isDragging = ref(false)
const selectionAnchor = ref(null)

// Автоскролл при drag-селекции у краев экрана
const AUTO_SCROLL_EDGE_PX = 40
const AUTO_SCROLL_SPEED_PX = 14
const autoScrollDirection = ref(0) // -1 влево, 1 вправо, 0 — нет
let autoScrollRAF = null

const normalizeDate = (date) => {
    if (!date) return date
    if (typeof date === 'string') return date.split('T')[0]
    try {
        const d = new Date(date)
        return isNaN(d.getTime()) ? date : d.toISOString().split('T')[0]
    } catch (e) { return date }
}

const onCellMouseDown = (event) => {
    const target = event.currentTarget
    const projectId = Number(target.dataset.projectId)
    const batchId = Number(target.dataset.batchId)
    const imageId = Number(target.dataset.imageId)
    const date = normalizeDate(target.dataset.date)
    const dateIndex = Number(target.dataset.dateIndex)

    if (event.shiftKey && selectionAnchor.value && selectionAnchor.value.image_id === imageId && selectionAnchor.value.project_id === projectId && selectionAnchor.value.batch_id === batchId) {
        selectRangeWithinImage({ projectId, batchId, imageId, startIndex: selectionAnchor.value.dateIndex, endIndex: dateIndex })
        return
    }

    if (event.ctrlKey || event.metaKey) {
        // Тоггл выделения ячейки
        if (isCellSelected(date, projectId, batchId, imageId)) {
            store.dispatch('coloredCells/unselectCellsByDescriptors', [{ project_id: projectId, batch_id: batchId, image_id: imageId, date }])
        } else {
            store.dispatch('coloredCells/selectCellsByDescriptors', [{ project_id: projectId, batch_id: batchId, image_id: imageId, date }])
        }
        selectionAnchor.value = { project_id: projectId, batch_id: batchId, image_id: imageId, date, dateIndex }
        return
    }

    // Обычный клик — сбрасываем и выделяем одну, начинаем drag
    store.dispatch('coloredCells/clearSelection')
    store.dispatch('coloredCells/selectCellsByDescriptors', [{ project_id: projectId, batch_id: batchId, image_id: imageId, date }])
    selectionAnchor.value = { project_id: projectId, batch_id: batchId, image_id: imageId, date, dateIndex }
    isDragging.value = true
}

const onCellMouseEnter = (event) => {
    if (!isDragging.value || !selectionAnchor.value) return
    const target = event.currentTarget
    const projectId = Number(target.dataset.projectId)
    const batchId = Number(target.dataset.batchId)
    const imageId = Number(target.dataset.imageId)
    const dateIndex = Number(target.dataset.dateIndex)

    // Ограничиваем drag рамками того же батча и проекта
    if (selectionAnchor.value.project_id !== projectId || selectionAnchor.value.batch_id !== batchId) return

    // Если в той же строке — горизонтальное выделение
    if (selectionAnchor.value.image_id === imageId) {
        selectRangeWithinImage({ projectId, batchId, imageId, startIndex: selectionAnchor.value.dateIndex, endIndex: dateIndex })
        return
    }

    // Если другая строка того же батча — прямоугольное выделение по вертикали и горизонтали
    selectRectangleAcrossImages({
        projectId,
        batchId,
        startImageId: selectionAnchor.value.image_id,
        endImageId: imageId,
        startDateIndex: selectionAnchor.value.dateIndex,
        endDateIndex: dateIndex
    })
}

const onGlobalMouseUp = () => {
    isDragging.value = false
    autoScrollDirection.value = 0
    stopAutoScroll()
}

const selectRangeWithinImage = ({ projectId, batchId, imageId, startIndex, endIndex }) => {
    const left = Math.min(startIndex, endIndex)
    const right = Math.max(startIndex, endIndex)
    const descriptors = []
    for (let i = left; i <= right; i++) {
        const d = normalizeDate(allDatesInThreeMonths.value[i])
        descriptors.push({ project_id: projectId, batch_id: batchId, image_id: imageId, date: d })
    }
    store.dispatch('coloredCells/clearSelection')
    store.dispatch('coloredCells/selectCellsByDescriptors', descriptors)
}

const selectRectangleAcrossImages = ({ projectId, batchId, startImageId, endImageId, startDateIndex, endDateIndex }) => {
    const images = getBatchImages(projectId, batchId) || []
    const idToIndex = new Map(images.map((img, idx) => [Number(img.id), idx]))
    const startImgIdx = idToIndex.has(Number(startImageId)) ? idToIndex.get(Number(startImageId)) : -1
    const endImgIdx = idToIndex.has(Number(endImageId)) ? idToIndex.get(Number(endImageId)) : -1
    if (startImgIdx === -1 || endImgIdx === -1) return

    const top = Math.min(startImgIdx, endImgIdx)
    const bottom = Math.max(startImgIdx, endImgIdx)
    const left = Math.min(startDateIndex, endDateIndex)
    const right = Math.max(startDateIndex, endDateIndex)

    const descriptors = []
    for (let imgIdx = top; imgIdx <= bottom; imgIdx++) {
        const currentImageId = Number(images[imgIdx].id)
        for (let i = left; i <= right; i++) {
            const d = normalizeDate(allDatesInThreeMonths.value[i])
            descriptors.push({ project_id: projectId, batch_id: batchId, image_id: currentImageId, date: d })
        }
    }

    store.dispatch('coloredCells/clearSelection')
    store.dispatch('coloredCells/selectCellsByDescriptors', descriptors)
}

const onGlobalMouseMove = (event) => {
    if (!isDragging.value) {
        if (autoScrollDirection.value !== 0) {
            autoScrollDirection.value = 0
            stopAutoScroll()
        }
        return
    }

    let dir = 0

    const container = document.querySelector('.images-virtual-container') || document.getElementById('calendar-dates-scroll')
    if (container) {
        const rect = container.getBoundingClientRect()
        if (event.clientX >= rect.right - AUTO_SCROLL_EDGE_PX) {
            dir = 1
        } else if (event.clientX <= rect.left + AUTO_SCROLL_EDGE_PX) {
            dir = -1
        }
    } else {
        // Фолбэк на края окна, если контейнер не найден
        const x = event.clientX
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth
        if (x >= viewportWidth - AUTO_SCROLL_EDGE_PX) {
            dir = 1
        } else if (x <= AUTO_SCROLL_EDGE_PX) {
            dir = -1
        }
    }

    if (dir !== autoScrollDirection.value) {
        autoScrollDirection.value = dir
        if (dir !== 0) startAutoScroll()
        else stopAutoScroll()
    }
}

function startAutoScroll() {
    if (autoScrollRAF != null) return
    const step = () => {
        if (!isDragging.value || autoScrollDirection.value === 0) {
            autoScrollRAF = null
            return
        }

        const clamp = (val, min, max) => Math.min(Math.max(val, min), max)
        let didScroll = false

        const header = document.getElementById('calendar-dates-scroll')
        if (header && header.scrollWidth > header.clientWidth) {
            const maxLeft = Math.max(0, header.scrollWidth - header.clientWidth)
            const next = clamp(
                header.scrollLeft + AUTO_SCROLL_SPEED_PX * autoScrollDirection.value,
                0,
                maxLeft
            )
            if (next !== header.scrollLeft) {
                header.scrollLeft = next
                didScroll = true
            }
        } else {
            // Фолбэк на контейнер изображений, если хедер недоступен
            const imagesContainer = document.querySelector('.images-virtual-container')
            if (imagesContainer && imagesContainer.scrollWidth > imagesContainer.clientWidth) {
                const maxLeft = Math.max(0, imagesContainer.scrollWidth - imagesContainer.clientWidth)
                const next = clamp(
                    imagesContainer.scrollLeft + AUTO_SCROLL_SPEED_PX * autoScrollDirection.value,
                    0,
                    maxLeft
                )
                if (next !== imagesContainer.scrollLeft) {
                    imagesContainer.scrollLeft = next
                    didScroll = true
                }
            }
        }

        if (!didScroll) {
            // Достигли края — останавливаем автоскролл
            autoScrollDirection.value = 0
            autoScrollRAF = null
            return
        }

        autoScrollRAF = requestAnimationFrame(step)
    }
    autoScrollRAF = requestAnimationFrame(step)
}

function stopAutoScroll() {
    if (autoScrollRAF != null) {
        cancelAnimationFrame(autoScrollRAF)
        autoScrollRAF = null
    }
}

</script>

<style scoped>
.images-calendar-grid {
    display: flex;
    flex-direction: column;
    position: relative;
    user-select: none;
    height: 100%;
}

.images-virtual-container {
    flex: 1;
    overflow-y: hidden;
    overflow-x: hidden;
}

.batch-container,
.image-container {
    display: flex;
    flex-direction: column;
}

.project-cells-container,
.batch-cells-container,
.image-cells-container {
    display: flex;
    flex-direction: column;
    height: 6vh;
    min-height: 6vh;
}

.project-row,
.batch-row,
.image-row {
    display: flex;
    height: 6vh;
    min-height: 6vh;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    -ms-overflow-style: none;
    scroll-behavior: smooth;
}

.project-row::-webkit-scrollbar,
.batch-row::-webkit-scrollbar,
.image-row::-webkit-scrollbar {
    display: none;
}

.project-cell,
.batch-cell,
.image-cell {
    width: 3vw;
    min-width: 3vw;
    height: 6vh;
    box-sizing: border-box;
    border: 1px solid #acacac;
    background: #f9f9f9;
    cursor: pointer;
    transition: all 0.1s ease-in-out;
    flex-shrink: 0;
    overflow: hidden;
    font-weight: 900;
    font-size: 2vmin;
    align-items: center;
    display: flex;
    justify-content: center;
}

.project-cell:hover,
.batch-cell:hover,
.image-cell:hover {
    background: #f0f0f0;
    border-color: #888;
}

.project-cell.selected,
.batch-cell.selected,
.image-cell.selected {
    border: 2px solid #007bff;
    background-color: rgba(0, 123, 255, 0.1);
    position: relative;
    z-index: 1;
}

.project-cell.weekend,
.batch-cell.weekend,
.image-cell.weekend {
    background: #f5f5f5;
}

/* Разные цвета для разных типов */
.project-cell {
    background: #e3f2fd;
}

.batch-cell {
    background: #f3e5f5;
}



/* Стиль для пустых блоков */
.empty-block {
    background: #f8f9fa !important;
    border: 1px solid #e9ecef !important;
    cursor: default !important;
    opacity: 0.7;
}

.empty-block:hover {
    background: #f8f9fa !important;
    border-color: #e9ecef !important;
    opacity: 0.8;
}

/* Стили для интерактивных ячеек изображений */
.image-cell {
    cursor: pointer !important;
    transition: all 0.2s ease-in-out;
}

.image-cell:hover {
    background: #e3f2fd !important;
    border-color: #2196f3 !important;
    transform: scale(1.02);
}

.image-cell.selected {
    border: 2px solid #007bff !important;
    background-color: rgba(0, 123, 255, 0.1) !important;
    position: relative;
    z-index: 1;
    box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
}
</style>
