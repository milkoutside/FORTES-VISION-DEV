<template>
    <div>
        <div class="status-section">
            <div class="status-controls">
                <Button
                    icon="pi pi-chevron-left"
                    class="scroll-btn"
                    :disabled="!canScrollLeft"
                    @click="scrollLeft"
                    text
                    rounded
                    size="small"
                />

                <div class="statuses-container" ref="statusesContainer">
                    <div class="statuses-wrapper" ref="statusesWrapper">

                        <div
                            v-if="statusesWithoutWeekend?.length > 0"
                            v-for="status in statusesWithoutWeekend"
                            :key="status.id"
                            class="status-item"
                            :class="{ 'selected': selectedStatus && selectedStatus.id === status.id }"
                            :style="{ backgroundColor: status.color + '40' }"
                            @click="selectStatus(status)"
                        >
                            <div class="status-color" :style="{ backgroundColor: status.color }"></div>
                            <div class="status-name">{{ status.name }}</div>
                        </div>
                        <div style="font-weight: 900" v-else>
                            Empty
                        </div>

                    </div>
                </div>

                <Button
                    icon="pi pi-chevron-right"
                    class="scroll-btn"
                    :disabled="!canScrollRight"
                    @click="scrollRight"
                    text
                    rounded
                    size="small"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import Button from "primevue/button";
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from "vue";
import storage from "@/storage/storage.js";

const statusesContainer = ref(null)
const statusesWrapper = ref(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

// Используем storage вместо store
const statuses = computed(() => storage.getters['statuses/allStatuses'])
const statusesWithoutWeekend = computed(() =>
    storage.getters['statuses/allStatuses'].filter(status => status.name !== "Weekend")
)
const selectedStatus = computed(() => storage.getters['statuses/selectedStatus'])

// Scroll functionality
const scrollStep = 120

const checkScroll = () => {
    if (statusesWrapper.value) {
        const wrapper = statusesWrapper.value
        canScrollLeft.value = wrapper.scrollLeft > 0
        canScrollRight.value = wrapper.scrollLeft < (wrapper.scrollWidth - wrapper.clientWidth)
    }
}

const scrollLeft = () => {
    if (statusesWrapper.value) {
        statusesWrapper.value.scrollBy({left: -scrollStep, behavior: 'smooth'})
    }
}

const scrollRight = () => {
    if (statusesWrapper.value) {
        statusesWrapper.value.scrollBy({left: scrollStep, behavior: 'smooth'})
    }
}

const selectStatus = async (status) => {
    storage.dispatch('statuses/selectStatus', status)
    const selectedStatusValue = selectedStatus.value
    if (!selectedStatusValue) return

    // Собираем выбранные ключи из стора coloredCells
    const items = []
    const selectedKeys = storage.state.coloredCells.selectedKeys
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
    await storage.commit('coloredCells/clearSelection');
    await storage.dispatch('ui/contextMenu/images/hideContextMenu');
    await storage.dispatch('coloredCells/bulkColor', {items});
}

// Setup scroll checking
onMounted(() => {
    if (statusesWrapper.value) {
        statusesWrapper.value.addEventListener('scroll', checkScroll)
        // Check initial scroll state
        nextTick(checkScroll)
    }

})

onUnmounted(() => {
    if (statusesWrapper.value) {
        statusesWrapper.value.removeEventListener('scroll', checkScroll)
    }
})

// Check scroll state when statuses change
watch(statuses, () => {
    console.log('tick', statuses)
    nextTick(checkScroll)
})

</script>

<style scoped>
.status-section {
    display: flex;
    align-items: center;
    gap: 16px;
}

.status-label {
    font-weight: 500;
    color: #495057;
}

.status-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%; /* Добавляем width: 100% для родительского контейнера */
}

.scroll-btn {
    width: 24px;
    height: 24px;
    flex: 0 0 auto;
}

.settings-btn {
    width: 24px;
    height: 24px;
    flex: 0 0 auto;
    margin-left: 8px;
}

.statuses-container {
    overflow: hidden;
    max-width: 100%; /* Увеличиваем с 400px до 800px */
    position: relative;
}


.statuses-wrapper {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    scroll-behavior: smooth;
    scrollbar-width: none;
    -ms-overflow-style: none;
    padding: 2px 0; /* Добавляем немного padding для лучшего отображения */
}

.statuses-wrapper::-webkit-scrollbar {
    display: none;
}

.status-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.2s ease;
    white-space: nowrap;
    flex: 0 0 auto;
}

.status-item:hover {
    border-color: #ccc;
}

.status-item.selected {
    border-color: #007bff;
    box-shadow: 0 0 0 1px #007bff;
}

.status-color {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    flex: 0 0 auto;
}

.status-name {
    font-size: 12px;
    color: #495057;
}

/* Color picker styles */
.color-picker {
    width: 40px;
    height: 32px;
}

.color-picker :deep(.p-colorpicker-trigger) {
    width: 40px;
    height: 32px;
    border-radius: 4px;
}

.status-management {
    padding: 8px 0;
}

.add-status-form h4,
.existing-statuses h4 {
    margin-bottom: 16px;
    color: #495057;
}

.status-list {
    max-height: 300px;
    overflow-y: auto;
}

.status-edit-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid #e9ecef;
}

.status-edit-item:last-child {
    border-bottom: none;
}

.status-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
}

.status-color-large {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    flex: 0 0 auto;
}

.status-name-input {
    flex: 1;
    max-width: 200px;
}

.status-name-display {
    color: #495057;
    font-weight: 500;
}

.status-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}
</style>
