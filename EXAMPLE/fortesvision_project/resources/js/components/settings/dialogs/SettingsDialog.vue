<template>
    <div>
        <Dialog
            :visible="showDialog"
            @update:visible="updateDialogVisibility"
            modal
            header="Settings"
            class="split-menu-dialog fullscreen-dialog"
            :pt="{
                root: { class: 'p-dialog-maximized' }
            }"
        >
            <div class="split-container">
                <!-- Left Menu Panel -->
                <div class="left-panel">
                    <!-- Menu Items -->
                    <div class="menu-content">
                        <div
                            class="menu-item"
                            :class="{ 'active': activeMenuItem === 'statuses' }"
                            @click="setActiveMenuItem('statuses')"
                        >
                            <i class="pi pi-circle"></i>
                            <span>Statuses</span>
                        </div>
                        <div
                            class="menu-item"
                            :class="{ 'active': activeMenuItem === 'users' }"
                            @click="setActiveMenuItem('users')"
                        >
                            <i class="pi pi-circle"></i>
                            <span>Users</span>
                        </div>
                    </div>
                </div>

                <!-- Right Content Panel -->
                <div class="right-panel">
                    <!-- Statuses Content -->
                    <div v-if="activeMenuItem === 'statuses'" class="content-section">
                        <div class="flex justify-between items-center mb-4">
                            <StatusesTab></StatusesTab>
                        </div>
                    </div>
                    <div v-if="activeMenuItem === 'users'" class="content-section">
                        <div class="flex justify-between items-center mb-4">
                            <UsersTab></UsersTab>
                        </div>
                    </div>
                </div>
            </div>
        </Dialog>
    </div>
</template>

<script setup>
import Dialog from 'primevue/dialog'
import Badge from 'primevue/badge'
import { computed, ref } from "vue"
import storage from "@/storage/storage.js"
import StatusesTab from "@/components/settings/dialogs/tabs/StatusesTab.vue";
import UsersTab from "@/components/settings/dialogs/tabs/UsersTab.vue";
// Импортируйте ваш StatusesTab компонент


const showDialog = computed(() => storage.getters['ui/settingsDialog/showDialog'])
const activeMenuItem = ref('statuses') // Изменил на 'statuses' чтобы контент отображался

const setActiveMenuItem = (item) => {
    activeMenuItem.value = item
}

// Добавил обработчик для закрытия диалога
const updateDialogVisibility = (value) => {
    if (value) {
        storage.commit('ui/settingsDialog/SHOW_DIALOG')
    } else {
        storage.commit('ui/settingsDialog/HIDE_DIALOG')
    }
}
</script>

<style scoped>
.split-menu-dialog :deep(.p-dialog-content) {
    padding: 0;
    height: calc(80vh - 120px);
}

.split-container {
    display: flex;
    height: 100%;
}

/* Left Panel Styles */
.left-panel {
    width: 280px;
    border-right: 1px solid var(--p-surface-border);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
}

.menu-header {
    padding: 1rem;
    border-bottom: 1px solid var(--p-surface-border);
}

.menu-content {
    flex: 1;
    padding: 1rem 0;
}

.menu-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    cursor: pointer;
    transition: all 0.2s;
    margin: 0 0.5rem;
    border-radius: 6px;
    margin-bottom: 0.25rem;
}

.menu-item:hover {
    background-color: var(--p-surface-100);
}

.menu-item.active {
    background-color: var(--p-primary-color);
    color: white;
}

.menu-item.active i {
    color: white;
}

.menu-item i:first-child {
    width: 1rem;
    text-align: center;
}

.menu-footer {
    padding: 1rem;
    border-top: 1px solid var(--p-surface-border);
    margin-top: auto;
}

.user-info {
    border-radius: 6px;
}

/* Right Panel Styles */
.right-panel {
    flex: 1;
    padding: 1.5rem;
    overflow-y: auto;
    background-color: var(--p-surface-0);
}

.content-section {
    height: 100%;
}

/* Dashboard Styles */
.stat-card {
    background: var(--p-surface-50);
    padding: 1.5rem;
    border-radius: 8px;
    text-align: center;
    border: 1px solid var(--p-surface-border);
}

/* Users Styles */
.users-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
}

.user-card {
    background: var(--p-surface-50);
    padding: 1.5rem;
    border-radius: 8px;
    text-align: center;
    border: 1px solid var(--p-surface-border);
}

/* Settings Styles */
.setting-group {
    background: var(--p-surface-50);
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid var(--p-surface-border);
}

.setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--p-surface-border);
}

.setting-item:last-child {
    border-bottom: none;
}

/* Reports Styles */
.reports-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
}

.report-card {
    background: var(--p-surface-50);
    padding: 1.5rem;
    border-radius: 8px;
    text-align: center;
    border: 1px solid var(--p-surface-border);
}

/* Status Styles */
.add-status-form {
    background-color: var(--p-surface-50);
    padding: 1rem;
    border-radius: 6px;
    border: 1px solid var(--p-surface-border);
}

.status-selection {
    background-color: var(--p-surface-50);
    padding: 1rem;
    border-radius: 6px;
    border: 1px solid var(--p-surface-border);
}

.status-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.statuses-container {
    flex: 1;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.statuses-container::-webkit-scrollbar {
    display: none;
}

.statuses-wrapper {
    display: flex;
    gap: 0.5rem;
    padding: 0.25rem 0;
    min-width: max-content;
}

.status-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    border: 2px solid transparent;
    min-width: fit-content;
}

.status-item:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.status-item.selected {
    border-color: var(--p-primary-color);
    box-shadow: 0 0 0 1px var(--p-primary-color);
}

.status-color {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
}

.status-name {
    font-size: 0.875rem;
    font-weight: 500;
}

.scroll-btn {
    flex-shrink: 0;
}

.status-list-management {
    background-color: var(--p-surface-50);
    padding: 1rem;
    border-radius: 6px;
    border: 1px solid var(--p-surface-border);
}

.status-edit-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    background: var(--p-surface-0);
    border-radius: 6px;
    border: 1px solid var(--p-surface-border);
}

.status-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.status-color-large {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    flex-shrink: 0;
}

.status-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.color-picker {
    flex-shrink: 0;
}

.status-name-input {
    min-width: 150px;
}

.status-name-display {
    font-weight: 500;
}

.settings-btn {
    width: 24px;
    height: 24px;
    flex: 0 0 auto;
    margin-left: 8px;
}

</style>
