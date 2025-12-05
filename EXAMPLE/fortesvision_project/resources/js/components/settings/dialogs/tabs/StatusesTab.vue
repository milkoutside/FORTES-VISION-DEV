<template>
    <div>
        <div class="status-management">
            <!-- Add new status form -->
            <div class="add-status-form">
                <h4>Add new status</h4>
                <div class="row justify-content-center align-items-center">
                    <div class="col text-start">
                        <InputText
                            v-model="newStatus.name"
                            placeholder="Status name"
                            class="flex-1 mb-2"
                        />
                    </div>
                    <div class="col text-center">
                        <ColorPicker
                            v-model="newStatus.color"
                            format="hex"
                            class="color-picker"
                        />
                    </div>
                    <div class="col-auto text-center">
                        <Button
                            label="Create"
                            @click="addStatus"
                            :disabled="!newStatus.name.trim()"
                            severity="success"
                            size="small"
                        />
                    </div>
                </div>
            </div>

            <Divider/>

            <!-- Search input -->
            <div class="search-section">
                <div class="search-filter-row">
                    <InputText
                        v-model="searchQuery"
                        placeholder="Status Search..."
                        class="search-input"
                    />
                </div>
            </div>
            <!-- Existing statuses list -->
            <div class="existing-statuses">
                <div class="status-list">
                    <div
                        v-for="status in filteredStatuses"
                        :key="status.id"
                        class="status-edit-item"
                    >
                        <div class="status-info">
                            <div
                                class="status-color-large"
                                :style="{ backgroundColor: status.color }"
                            ></div>
                            <InputText
                                v-if="editingStatus === status.id"
                                v-model="editForm.name"
                                class="status-name-input"
                                @keyup.enter="saveStatus(status)"
                                @keyup.escape="cancelEdit"
                            />
                            <span v-else class="status-name-display">{{ status.name }}</span>
                        </div>

                        <div class="status-actions">
                            <ColorPicker
                                v-if="editingStatus === status.id"
                                v-model="editForm.color"
                                format="hex"
                                class="color-picker"
                            />

                            <template v-if="editingStatus === status.id">
                                <Button
                                    icon="pi pi-check"
                                    @click="saveStatus(status)"
                                    text
                                    rounded
                                    size="small"
                                    severity="success"
                                />
                                <Button
                                    icon="pi pi-times"
                                    @click="cancelEdit"
                                    text
                                    rounded
                                    size="small"
                                    severity="secondary"
                                />
                            </template>

                            <template v-else>
                                <Button
                                    icon="pi pi-pencil"
                                    @click="startEdit(status)"
                                    text
                                    rounded
                                    size="small"
                                />
                                <Button
                                    icon="pi pi-trash"
                                    @click="deleteStatus(status)"
                                    text
                                    rounded
                                    size="small"
                                    severity="danger"
                                />
                            </template>
                        </div>
                    </div>

                    <!-- No results message -->
                    <div v-if="filteredStatuses.length === 0 && searchQuery" class="no-results">
                        Statuses not found
                    </div>
                </div>
            </div>
        </div>
        <Dialog
            v-model:visible="showDeleteDialog"
            modal
            header="Confirming deletion"
            :style="{ width: '400px' }"
        >
            <p>Are you sure you want to delete the status "{{ statusToDelete?.name }}"?</p>
            <template #footer>
                <Button
                    label="Cancel"
                    @click="showDeleteDialog = false"
                    text
                />
                <Button
                    label="Delete"
                    @click="confirmDelete"
                    severity="danger"
                />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import InputText from "primevue/inputtext";
import ColorPicker from "primevue/colorpicker";
import Divider from "primevue/divider";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from "vue";
import {useStore} from "vuex";

const statusesContainer = ref(null)
const statusesWrapper = ref(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

// Search
const searchQuery = ref('')

// Dialog states
const showStatusDialog = ref(false)
const showDeleteDialog = ref(false)
const statusToDelete = ref(null)

// Edit states
const editingStatus = ref(null)
const editForm = ref({ name: '', color: ''})
const newStatus = ref({ name: '', color: '3498db' })

// Store
const store = useStore()
const statuses = computed(() => store.getters['statuses/allStatuses'])
const selectedStatus = computed(() => store.getters['statuses/selectedStatus'])

// Filtered statuses
const filteredStatuses = computed(() => {
    let filtered = statuses.value

    // Filter by search query
    if (searchQuery.value) {
        filtered = filtered.filter(status =>
            status.name.toLowerCase().includes(searchQuery.value.toLowerCase())
        )
    }

    return filtered
})

// Scroll functionality
const scrollStep = 120
let scrollInterval = null

const checkScroll = () => {
    if (statusesWrapper.value) {
        const wrapper = statusesWrapper.value
        canScrollLeft.value = wrapper.scrollLeft > 0
        canScrollRight.value = wrapper.scrollLeft < (wrapper.scrollWidth - wrapper.clientWidth)
    }
}

const scrollLeft = () => {
    if (statusesWrapper.value) {
        statusesWrapper.value.scrollBy({ left: -scrollStep, behavior: 'smooth' })
    }
}

const scrollRight = () => {
    if (statusesWrapper.value) {
        statusesWrapper.value.scrollBy({ left: scrollStep, behavior: 'smooth' })
    }
}

// Status management
const addStatus = () => {
    if (newStatus.value.name.trim()) {
        const color = newStatus.value.color.startsWith('#') ? newStatus.value.color : `#${newStatus.value.color}`
        console.log({  name: newStatus.value.name.trim(),
            color: color})

        store.dispatch('statuses/addStatus', {
            name: newStatus.value.name.trim(),
            color: color
        })

        newStatus.value = { name: '', color: '3498db' }

        nextTick(() => {
            if (statusesWrapper.value) {
                statusesWrapper.value.scrollLeft = statusesWrapper.value.scrollWidth
                checkScroll()
                //store.dispatch('calendar/cells/clearSelection');
            }
        })
    }
}

const startEdit = (status) => {
    editingStatus.value = status.id
    const colorWithoutHash = status.color.startsWith('#') ? status.color.substring(1) : status.color
    editForm.value = {
        name: status.name,
        color: colorWithoutHash
    }
}

const cancelEdit = () => {
    editingStatus.value = null
    editForm.value = { name: '', color: '' }
}

const saveStatus = (status) => {
    if (editForm.value.name.trim()) {
        const color = editForm.value.color.startsWith('#') ? editForm.value.color : `#${editForm.value.color}`

        store.dispatch('statuses/updateStatus', {
            id: status.id,
            name: editForm.value.name.trim(),
            color: color
        })
        //store.dispatch('calendar/cells/clearSelection');
        cancelEdit()
    }
}

const deleteStatus = (status) => {
    statusToDelete.value = status
    showDeleteDialog.value = true
}

const confirmDelete = () => {
    if (statusToDelete.value) {
        store.dispatch('statuses/deleteStatus', statusToDelete.value.id)
        statusToDelete.value = null
        showDeleteDialog.value = false
       // store.dispatch('calendar/cells/clearSelection');
    }
}

const selectStatus = (status) => {
    store.dispatch('statuses/selectStatus', status)
}

// Setup scroll checking
onMounted(() => {
    if (statusesWrapper.value) {
        statusesWrapper.value.addEventListener('scroll', checkScroll)
        nextTick(checkScroll)
    }

    watch(statuses, () => {
        nextTick(checkScroll)
    })
})

onUnmounted(() => {
    if (statusesWrapper.value) {
        statusesWrapper.value.removeEventListener('scroll', checkScroll)
    }
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
    width: 100%;
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
    max-width: 415px;
    position: relative;
}

.statuses-wrapper {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    scroll-behavior: smooth;
    scrollbar-width: none;
    -ms-overflow-style: none;
    padding: 2px 0;
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

.search-section {
    margin-bottom: 16px;
}

.search-input {
    width: 100%;
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

.no-results {
    text-align: center;
    color: #6c757d;
    font-style: italic;
    padding: 20px;
}
.search-section {
    margin-bottom: 16px;
}

.search-filter-row {
    display: flex;
    gap: 12px;
    align-items: center;
}

.search-input {
    flex: 1;
}

</style>
