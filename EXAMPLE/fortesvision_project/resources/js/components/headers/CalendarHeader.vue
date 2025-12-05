<template>
    <div class="calendar-container">
        <!-- Горизонтальный календарь -->
        <div
            class="calendar-header"
            id="calendar-dates-scroll"
            :style="edgeGlowStyles"
            :class="{ dragging: isDragging }"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
            @pointerleave="onPointerUp"
        >
            <div class="dates-container">
                <div
                    v-for="(month, monthIndex) in threeMonthsData"
                    :key="monthIndex"
                    class="month-section"
                >
                    <!-- Подсветка только у начала первого и конца последнего месяца -->
                    <div v-if="monthIndex === 0" class="edge-glow left"></div>
                    <div v-if="monthIndex === threeMonthsData.length - 1" class="edge-glow right"></div>
                    <div class="month-header">
                        <button
                            v-if="monthIndex === 0"
                            @click="goToPreviousThreeMonths"
                            class="nav-btn nav-btn-left"
                        >‹‹</button>
                        <div v-else class="nav-placeholder"></div>

                        <span class="month-title">{{ month.monthName }} {{ month.year }}</span>

                        <button
                            v-if="monthIndex === 2"
                            @click="goToNextThreeMonths"
                            class="nav-btn nav-btn-right"
                        >››</button>
                        <div v-else class="nav-placeholder"></div>
                    </div>
                    <div class="dates-row">
                        <div
                            v-for="(date, dateIndex) in month.dates"
                            :key="dateIndex"
                            class="date-cell"
                            :class="{
                                weekend: isWeekend(date),
                                today: isToday(date),
                                'current-month': monthIndex === 1
                            }"
                            @click="selectDate(date)"
                        >
                            <div class="day">{{ new Date(date).getDate() }}</div>
                            <div class="weekday">{{ getWeekday(new Date(date)) }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, nextTick, watch, ref, computed as vComputed } from 'vue'
import { useStore } from 'vuex'

const store = useStore();

const threeMonthsData = computed(() => store.getters['calendar/threeMonthsData']);
const isWeekend = (dateStr) => {
    const date = new Date(dateStr);
    return date.getDay() === 0 || date.getDay() === 6;
}

const isToday = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

const getWeekday = (date) => {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
}

const selectDate = (date) => {

}

// --- Автонавигация при удержании у края ---
const EDGE_PROXIMITY_PX = 40;           // Насколько близко к краю считаем «у края»
const EDGE_HOLD_MS = 500;              // Сколько держать, чтобы сработал автопереход
const INACTIVITY_RESET_MS = 350;        // За сколько без событий считаем, что активность прекратилась

const isAutoNavigating = ref(false);    // Флаг, чтобы не зациклиться на программном скролле/навигации
const isProgrammaticScroll = ref(false);
const isPointerDown = ref(false);
const isDragging = ref(false);
let dragStartX = 0;
let dragStartScrollLeft = 0;
let activePointerId = null;
const isWheelActive = ref(false);
const userActive = vComputed(() => isPointerDown.value || isWheelActive.value);

const edgeHoldSide = ref(null);         // 'left' | 'right' | null
let edgeHoldStart = 0;
let edgeHoldRaf = 0;
let wheelActivityTimeout = 0;

const leftProgress = ref(0);            // 0..1
const rightProgress = ref(0);           // 0..1

const clamp01 = (v) => Math.max(0, Math.min(1, v));

const getHeaderEl = () => document.getElementById('calendar-dates-scroll');

const nearLeftEdge = (el) => el ? el.scrollLeft <= EDGE_PROXIMITY_PX : false;
const nearRightEdge = (el) => {
    if (!el) return false;
    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    return (maxScrollLeft - el.scrollLeft) <= EDGE_PROXIMITY_PX;
}

const resetProgress = () => {
    leftProgress.value = 0;
    rightProgress.value = 0;
}

const cancelEdgeHold = () => {
    edgeHoldSide.value = null;
    if (edgeHoldRaf) cancelAnimationFrame(edgeHoldRaf);
    edgeHoldRaf = 0;
    resetProgress();
}

const tickEdgeHold = (ts) => {
    if (!edgeHoldSide.value) return;
    const elapsed = ts - edgeHoldStart;
    const progress = clamp01(elapsed / EDGE_HOLD_MS);
    if (edgeHoldSide.value === 'left') leftProgress.value = progress; else rightProgress.value = progress;

    const header = getHeaderEl();
    // Если ушли от края или нет активности пользователя — отменяем
    const stillNear = edgeHoldSide.value === 'left' ? nearLeftEdge(header) : nearRightEdge(header);
    if (!stillNear || !userActive.value || isAutoNavigating.value || isProgrammaticScroll.value) {
        cancelEdgeHold();
        return;
    }

    if (progress >= 1) {
        // Триггерим автопереход (сохраняем сторону до сброса)
        const side = edgeHoldSide.value;
        cancelEdgeHold();
        if (side === 'left') {
            void goToPreviousThreeMonths(true);
        } else {
            void goToNextThreeMonths(true);
        }
        return;
    }

    edgeHoldRaf = requestAnimationFrame(tickEdgeHold);
}

const startEdgeHold = (side) => {
    if (isAutoNavigating.value || isProgrammaticScroll.value) return;
    const header = getHeaderEl();
    if (!header) return;

    // Если сменили сторону — обнулим таймер
    if (edgeHoldSide.value !== side) {
        edgeHoldStart = performance.now();
        if (side === 'left') { leftProgress.value = 0; } else { rightProgress.value = 0; }
    }
    edgeHoldSide.value = side;
    if (!edgeHoldRaf) edgeHoldRaf = requestAnimationFrame(tickEdgeHold);
}

const goToPreviousThreeMonths = async (fromAuto = false) => {
    if (isAutoNavigating.value) return;
    isAutoNavigating.value = !!fromAuto;
    await store.dispatch('calendar/goToPreviousThreeMonths');
    // Сбрасываем скролл в начало при переходе к предыдущим месяцам
    await nextTick();
        resetScrollToStart();
    // Дадим времени завершить программный скролл
    setTimeout(() => { isAutoNavigating.value = false; }, 400);
}

const goToNextThreeMonths = async (fromAuto = false) => {
    if (isAutoNavigating.value) return;
    isAutoNavigating.value = !!fromAuto;
    await store.dispatch('calendar/goToNextThreeMonths');
    // Сбрасываем скролл в начало при переходе к следующим месяцам
    await nextTick();
        resetScrollToStart();
    setTimeout(() => { isAutoNavigating.value = false; }, 400);
}

// Функция для прокрутки к сегодняшней дате
const scrollToToday = () => {
    const header = document.getElementById('calendar-dates-scroll');
    if (!header) return;

    const todayCell = header.querySelector('.date-cell.today');
    if (!todayCell) return;

    // Корректное вычисление позиции независимо от position: relative у предков
    const headerRect = header.getBoundingClientRect();
    const cellRect = todayCell.getBoundingClientRect();
    const cellLeftWithinHeader = cellRect.left - headerRect.left + header.scrollLeft;

    const headerWidth = header.clientWidth;
    const cellWidth = todayCell.offsetWidth;

    // Центрируем ячейку в видимой области
    const targetScrollLeft = Math.max(0, cellLeftWithinHeader - (headerWidth - cellWidth) / 2);

    isProgrammaticScroll.value = true;
    header.scrollTo({
        left: targetScrollLeft,
        behavior: 'smooth'
    });
    setTimeout(() => { isProgrammaticScroll.value = false; }, 400);
}

// Функция для сброса скролла в начало
const resetScrollToStart = () => {
    const header = document.getElementById('calendar-dates-scroll');
    if (!header) return;

    // Сбрасываем скролл календаря
    isProgrammaticScroll.value = true;
    header.scrollTo({
        left: 0,
        behavior: 'smooth'
    });
    setTimeout(() => { isProgrammaticScroll.value = false; }, 400);

    // Также сбрасываем скролл связанного контейнера с изображениями
    const calendarCells = document.querySelector('.images-virtual-container');
    if (calendarCells) {
        calendarCells.scrollLeft = 0;
    }
}

// Альтернативные варианты реализации:

// Вариант 1: Использование scrollIntoView (самый простой)
// const scrollToTodaySimple = () => {
//     const todayCell = document.querySelector('.date-cell.today');
//     if (todayCell) {
//         todayCell.scrollIntoView({
//             behavior: 'smooth',
//             block: 'nearest',
//             inline: 'center'
//         });
//     }
// }

// Вариант 2: Использование Intersection Observer для автоматической прокрутки
// const setupAutoScroll = () => {
//     const observer = new IntersectionObserver((entries) => {
//         entries.forEach(entry => {
//             if (entry.target.classList.contains('today') && !entry.isIntersecting) {
//                 scrollToToday();
//             }
//         });
//     }, { root: document.getElementById('calendar-dates-scroll') });
//
//     const todayCell = document.querySelector('.date-cell.today');
//     if (todayCell) observer.observe(todayCell);
// }

// Вариант 3: Использование CSS scroll-snap для автоматического позиционирования
// (требует добавления CSS: scroll-snap-type: x mandatory; scroll-snap-align: center;)

const handleCalendarScroll = (event) => {
    const header = event.target;
    const targetScrollLeft = header.scrollLeft;
    const calendarCells = document.querySelector('.images-virtual-container');
    if (calendarCells) calendarCells.scrollLeft = targetScrollLeft;

    if (isProgrammaticScroll.value || isAutoNavigating.value) return;

    // Детекция близости к краям и запуск/сброс удержания
    const atLeft = nearLeftEdge(header);
    const atRight = nearRightEdge(header);

    if (userActive.value && (atLeft || atRight)) {
        startEdgeHold(atLeft ? 'left' : 'right');
    } else {
        cancelEdgeHold();
    }

    // Переменные смещения больше не используются; подсветки внутри dates-container
}

const onPointerDown = (e) => {
    isPointerDown.value = true;
    const header = getHeaderEl();
    if (!header) return;
    isDragging.value = true;
    activePointerId = e.pointerId;
    header.setPointerCapture && header.setPointerCapture(e.pointerId);
    dragStartX = e.clientX;
    dragStartScrollLeft = header.scrollLeft;
};

const onPointerMove = (e) => {
    if (!isDragging.value || e.pointerId !== activePointerId) return;
    const header = getHeaderEl();
    if (!header) return;
    const deltaX = e.clientX - dragStartX;
    header.scrollLeft = dragStartScrollLeft - deltaX;
};

const onPointerUp = (e) => {
    isPointerDown.value = false;
    const header = getHeaderEl();
    if (header && e && e.pointerId === activePointerId) {
        header.releasePointerCapture && header.releasePointerCapture(e.pointerId);
    }
    isDragging.value = false;
    activePointerId = null;
    cancelEdgeHold();
};

const onWheel = (e) => {
    const header = getHeaderEl();
    if (!header) return;
    const primaryDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (primaryDelta !== 0) {
        e.preventDefault();
        header.scrollLeft += primaryDelta;
    }
    isWheelActive.value = true;
    clearTimeout(wheelActivityTimeout);
    wheelActivityTimeout = setTimeout(() => { isWheelActive.value = false; }, INACTIVITY_RESET_MS);
}

// Функция для синхронизации скролла контейнера с ячейками с календарем
const syncCalendarScroll = () => {
    const calendarHeader = document.getElementById('calendar-dates-scroll');
    const calendarCells = document.querySelector('.images-virtual-container');

    if (calendarHeader && calendarCells) {
        // Синхронизируем позицию контейнера с ячейками с позицией календаря
        calendarCells.scrollLeft = calendarHeader.scrollLeft;
    }
}

// Добавляем синхронизацию скролла при монтировании компонента
onMounted(() => {
    const calendarHeader = document.getElementById('calendar-dates-scroll');

    if (calendarHeader) {
        calendarHeader.addEventListener('scroll', handleCalendarScroll, { passive: true });
        // wheel нужен непассивный, чтобы preventDefault сработал для горизонтального скролла
        calendarHeader.addEventListener('wheel', onWheel, { passive: false });
    }

    // Прокрутка к сегодняшней дате при первом рендере
    nextTick(() => {
        scrollToToday();
    });

    // Альтернативный вариант: отслеживание изменений данных календаря
    // watch(threeMonthsData, () => {
    //     nextTick(() => {
    //         scrollToToday();
    //     });
    // }, { immediate: true });
});

// Удаляем обработчики при размонтировании
onUnmounted(() => {
    const calendarHeader = document.getElementById('calendar-dates-scroll');

    if (calendarHeader) {
        calendarHeader.removeEventListener('scroll', handleCalendarScroll);
        calendarHeader.removeEventListener('wheel', onWheel);
    }
    cancelEdgeHold();
});

// Экспортируем функцию синхронизации для использования в других компонентах
const edgeGlowStyles = vComputed(() => ({
    '--edge-left': leftProgress.value,
    '--edge-right': rightProgress.value
}));

defineExpose({
    syncCalendarScroll
});
</script>

<style scoped>
.calendar-container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: white;
    height: 130px;
    min-height: 130px;
    position: sticky;
    top: 0;
    z-index: 100;
    box-sizing: border-box;
    flex-shrink: 0;
}

.calendar-header {
    background: white;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: thin;
    scroll-behavior: smooth;
    border-bottom: 1px solid #eee;
    height: 100%;
    box-sizing: border-box;
    position: relative;
    /* CSS vars для прогресса подсветки краёв */
    --edge-left: 0;
    --edge-right: 0;
}

.calendar-header::-webkit-scrollbar {
    height: 2px;
}

.calendar-header::-webkit-scrollbar-track {
    background: transparent;
}

.calendar-header::-webkit-scrollbar-thumb {
    background-color: #bbb;
    border-radius: 1px;
}

.calendar-header::-webkit-scrollbar-thumb:hover {
    background-color: #999;
}

.dates-container {
    display: flex;
    min-width: 100%;
    height: 100%;
    position: relative; /* для позиционирования edge-glow по фактическим краям контента */
}

.month-section {
    display: flex;
    flex-direction: column;
    min-width: fit-content;
    border-right: 2px solid #ddd;
    border-bottom: 1px solid #ddd;
    height: 100%;
    position: relative; /* для позиционирования edge-glow внутри месяца */
}

.month-section:last-child {
    border-right: none;
}

.month-header {
    font-size: 12px;
    font-weight: 600;
    color: #666;
    text-align: center;
    padding: 8px 12px;
    background: #f8f9fa;
    border-bottom: 1px solid #eee;
    white-space: nowrap;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 70%;
    box-sizing: border-box;
}

.month-title {
    flex: 1;
    text-align: center;
    margin: 0 8px;
    font-weight: 900;
    font-size: 2em;
}

.nav-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 50%;
    font-size: 16px;
    font-weight: bold;
    color: #666;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
}

.nav-btn:hover {
    background: #e9ecef;
    color: #333;
}

.nav-placeholder {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
}

.dates-row {
    display: flex;
    flex: 1;
    min-width: max-content;
    height: 30%;
}

.date-cell {
    width: 3vw;
    min-width: 3vw;
    height: 100%;
    border-right: 1px solid #eee;
    text-align: center;
    padding: 2px;
    cursor: pointer;
    transition: background-color 0.2s;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
    box-sizing: border-box;
}

.date-cell:hover {
    background: #f0f0f0;
}

.date-cell.weekend {
    background: #fafafa;
    color: #e74c3c;
    border-right: 1px solid #eee;
}

.date-cell.today {
    background: #3498db;
    color: white;
}

.date-cell.today:hover {
    background: #2980b9;
}

.date-cell.current-month {
    background: #f8f9fa;
}

.date-cell.current-month.weekend {
    background: #f0f0f0;
    border-right: 1px solid #eee;
}

.date-cell.current-month.today {
    background: #3498db;
}

.day {
    font-size: 12px;
    font-weight: 500;
    line-height: 1;
}

.weekday {
    font-size: 9px;
    color: #666;
    line-height: 1;
    margin-top: 1px;
}

.date-cell.today .weekday {
    color: rgba(255, 255, 255, 0.8);
}

.date-cell.weekend .weekday {
    color: #c0392b;
}

.date-cell.current-month .weekday {
    color: #555;
}

/* Подсветка краёв при удержании у границ */
.edge-glow {
    position: absolute; /* теперь фиксируем к краям конкретного месяца */
    top: 0;
    bottom: 0;
    width: 88px; /* шире для лучшей видимости */
    pointer-events: none;
    opacity: 0;
    transition: opacity 100ms linear;
    z-index: 2; /* поверх дат */
}

.edge-glow.left {
    left: 0;
    background: linear-gradient(90deg, rgba(52,152,219,0.55) 0%, rgba(52,152,219,0.28) 50%, rgba(52,152,219,0) 100%);
    opacity: var(--edge-left);
}

.edge-glow.right {
    right: 0;
    background: linear-gradient(270deg, rgba(52,152,219,0.55) 0%, rgba(52,152,219,0.28) 50%, rgba(52,152,219,0) 100%);
    opacity: var(--edge-right);
}

/* Курсор при перетаскивании */
.calendar-header.dragging {
    cursor: grabbing;
}
.calendar-header {
    cursor: grab;
}
</style>
