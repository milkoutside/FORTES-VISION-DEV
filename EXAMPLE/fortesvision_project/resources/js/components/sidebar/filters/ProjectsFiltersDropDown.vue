<template>
    <div class="filter-menu-container">
        <!-- Поле поиска (имитация) -->
        <div
            class="search-field"
            @click="toggleMenu"
            :class="{ 'active': isMenuOpen }"
        >
            <i class="pi pi-tags search-icon"></i>
            <span class="search-text">{{ searchPlaceholder }}</span>
            <i class="pi pi-chevron-down chevron-icon" :class="{ 'rotated': isMenuOpen }"></i>
        </div>

        <!-- Меню фильтров -->
        <div v-if="isMenuOpen" class="filter-menu" @click.stop>
            <!-- Главное меню -->
            <div v-if="currentView === 'main'" class="menu-main">
                <div class="menu-header">
                    <h4>Filters</h4>
                    <Button
                        text
                        size="small"
                        @click="clearAllFilters"
                        :disabled="!hasActiveFilters"
                    >
                        Clear All
                    </Button>
                </div>

                <div class="menu-items">
                    <div
                        class="menu-item"
                        @click="openSubmenu('users')"
                    >
                        <div class="menu-item-content">
                            <i class="pi pi-users"></i>
                            <span>Users</span>
                            <Badge
                                v-if="selectedUsers.length > 0"
                                :value="selectedUsers.length"
                                severity="info"
                            />
                        </div>
                        <i class="pi pi-chevron-right"></i>
                    </div>
                </div>
            </div>

            <!-- Подменю пользователей -->
            <div v-else-if="currentView === 'users'" class="menu-submenu">
                <div class="menu-header">
                    <Button
                        text
                        size="small"
                        @click="goBack"
                        class="back-button"
                    >
                        <i class="pi pi-arrow-left"></i>
                        Back
                    </Button>
                    <h4>Users</h4>
                    <Button
                        text
                        size="small"
                        @click="clearUsers"
                        :disabled="selectedUsers.length === 0"
                    >
                        Clear
                    </Button>
                </div>

                <div class="checkbox-list">
                    <div
                        v-for="user in allUsers"
                        :key="user.id"
                        class="checkbox-item"
                    >
                        <Checkbox
                            :inputId="'user-' + user.id"
                            v-model="selectedUsers"
                            :value="user.id"
                        />
                        <label :for="'user-' + user.id">
                            <div class="user-info">
                                <span class="user-name">{{ user.name }}</span>
                                <span class="user-role">{{ getRoleDisplayName(user.role) }}</span>
                            </div>
                        </label>
                    </div>
                </div>
            </div>


        </div>

        <!-- Overlay для закрытия меню -->
        <div
            v-if="isMenuOpen"
            class="menu-overlay"
            @click="closeMenu"
        ></div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useStore } from 'vuex'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Badge from 'primevue/badge'

const store = useStore()

// Реактивные данные
const isMenuOpen = ref(false)
const currentView = ref('main') // 'main', 'users'
const selectedUsers = ref([])

// Получаем данные из store
const allUsers = computed(() => store.getters['users/allUsers'])
const allProjects = computed(() => store.getters['projects/allProjects'])

// Вычисляемые свойства
const hasActiveFilters = computed(() => {
    return selectedUsers.value.length > 0
})

const searchPlaceholder = computed(() => {
    if (selectedUsers.value.length === 0) {
        return 'Project filters...'
    }
    return `Selected users: ${selectedUsers.value.length}`
})

// Эмиты
const emit = defineEmits(['filtersChanged'])

// Методы
const toggleMenu = () => {
    isMenuOpen.value = !isMenuOpen.value
    if (isMenuOpen.value) {
        currentView.value = 'main'
    }
}

const closeMenu = () => {
    isMenuOpen.value = false
    currentView.value = 'main'
}

const openSubmenu = (view) => {
    currentView.value = view
}

const goBack = () => {
    currentView.value = 'main'
}

const clearAllFilters = () => {
    selectedUsers.value = []
    emitFiltersChanged()
}

const clearUsers = () => {
    selectedUsers.value = []
    emitFiltersChanged()
}

const emitFiltersChanged = () => {
    console.log('Выбранные пользователи:', selectedUsers.value)

    // Обновляем фильтры в store
    store.dispatch('sidebar/filters/setSelectedUsers', selectedUsers.value)

    // Запускаем поиск проектов
    store.dispatch('sidebar/filters/searchProjects')

    emit('filtersChanged', {
        users: selectedUsers.value
    })
}

// Функция для отображения роли пользователя
const getRoleDisplayName = (role) => {
    const names = {
        'project_manager': 'Project Manager',
        'freelancer': 'Freelancer',
        'modeller': 'Modeller',
        'art_director': 'Art Director',
        'artist': 'Artist'
    }
    return names[role] || role
}

// Обработчик клика вне меню
const handleClickOutside = (event) => {
    const container = event.target.closest('.filter-menu-container')
    if (!container && isMenuOpen.value) {
        closeMenu()
    }
}

// Отслеживание изменений фильтров
const watchFilters = () => {
    emitFiltersChanged()
}

// Lifecycle hooks
onMounted(() => {
    document.addEventListener('click', handleClickOutside)

    // Загружаем пользователей если их нет
    if (allUsers.value.length === 0) {
        store.dispatch('users/fetchAllUsers')
    }
    // Убираем загрузку проектов - они загружаются постранично в ProjectsSidebar
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
})

// Watchers
watch([selectedUsers], watchFilters, { deep: true })
</script>

<style scoped>
.filter-menu-container {
    position: relative;
    width: 100%;
    max-width: 400px;
}

.search-field {
    display: flex;
    align-items: center;
    padding: 1vh 1vh;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;
}

.search-field:hover {
    border-color: #3b82f6;
}

.search-field.active {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.search-icon {
    color: #6b7280;
    margin-right: 0.5rem;
}

.search-text {
    flex: 1;
    color: #374151;
    font-size: 0.875rem;
}

.chevron-icon {
    color: #6b7280;
    transition: transform 0.2s;
}

.chevron-icon.rotated {
    transform: rotate(180deg);
}

.filter-menu {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 1000;
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    margin-top: 0.25rem;
    max-height: 400px;
    overflow-y: auto;
}

.menu-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
}

.menu-header h4 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
}

.back-button {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.menu-items {
    padding: 0.5rem 0;
}

.menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
}

.menu-item:hover {
    background: #f3f4f6;
}

.menu-item-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.menu-item-content i {
    color: #6b7280;
    width: 1rem;
}

.menu-item-content span {
    color: #374151;
    font-size: 0.875rem;
}

.checkbox-list {
    padding: 0.5rem 0;
    max-height: 250px;
    overflow-y: auto;
}

.checkbox-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
}

.checkbox-item:hover {
    background: #f3f4f6;
}

.checkbox-item label {
    cursor: pointer;
    color: #374151;
    font-size: 0.875rem;
    flex: 1;
}

.user-info, .project-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.user-name, .project-name {
    font-weight: 500;
    color: #374151;
}

.user-role, .project-client {
    font-size: 0.75rem;
    color: #6b7280;
}

.menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 999;
    background: rgba(0, 0, 0, 0.1);
}

/* Стили для скролла */
.filter-menu::-webkit-scrollbar,
.checkbox-list::-webkit-scrollbar {
    width: 6px;
}

.filter-menu::-webkit-scrollbar-track,
.checkbox-list::-webkit-scrollbar-track {
    background: #f1f1f1;
}

.filter-menu::-webkit-scrollbar-thumb,
.checkbox-list::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.filter-menu::-webkit-scrollbar-thumb:hover,
.checkbox-list::-webkit-scrollbar-thumb:hover {
    background: #a1a1a1;
}
</style>
