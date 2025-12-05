<template>
    <div class="user-multiselect-wrapper">
        <MultiSelect
            v-model="internalSelectedIds"
            :options="users"
            :loading="loading"
            :filter="true"
            :filterPlaceholder="filterPlaceholder"
            :placeholder="placeholder"
            :optionLabel="optionLabel"
            :optionValue="optionValue"
            :maxSelectedLabels="maxSelectedLabels"
            :selectedItemsLabel="selectedItemsLabel"
            :showClear="false"
            :disabled="disabled || isInitialLoading"
            :invalid="invalid"
            :class="wrapperClass"
            @filter="onFilter"
            @show="onShow"
            @hide="onHide"
            @change="onChange"
            :virtualScrollerOptions="virtualScrollerOptions"
        >
            <template #option="slotProps">
                <div class="user-option">
                    <div class="user-info">
                        <span class="user-name">{{ slotProps.option[optionLabel] }}</span>
                        <span class="user-id" v-if="showId">#{{ slotProps.option.id }}</span>
                    </div>
                    <Tag
                        :value="getRoleDisplayName(slotProps.option.role)"
                        :severity="getRoleSeverity(slotProps.option.role)"
                        class="user-role-tag"
                        v-if="showRole"
                    />
                </div>
            </template>
            <template #value="slotProps" v-if="customValueTemplate">
                <div class="selected-users-display" v-if="slotProps.value && slotProps.value.length && !isInitialLoading">
                    <div class="selected-user-item" v-for="user in getSelectedUserObjects().slice(0, maxSelectedLabels)" :key="user.id">
                        <span>{{ user[optionLabel] }}</span>
                    </div>
                    <span v-if="slotProps.value.length > maxSelectedLabels" class="remaining-count">
                        +{{ slotProps.value.length - maxSelectedLabels }} more
                    </span>
                </div>
                <div v-else-if="isInitialLoading && selectedUsers.length" class="loading-selected">
                    Loading selected users...
                </div>
                <span v-else class="placeholder-text">{{ placeholder }}</span>
            </template>
            <template #emptyfilter>
                <div class="empty-filter-message">
                    {{ emptyFilterMessage }}
                </div>
            </template>
            <template #empty>
                <div class="empty-message">
                    {{ emptyMessage }}
                </div>
            </template>
        </MultiSelect>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, readonly } from 'vue';
import MultiSelect from 'primevue/multiselect';
import Tag from 'primevue/tag';
import storage from "@/storage/storage.js";

const props = defineProps({
    // Основные пропсы
    role: {
        type: String,
        required: true,
        validator: (value) => ['freelancer', 'modeller', 'project_manager', 'art_director', 'artist'].includes(value)
    },
    modelValue: {
        type: Array,
        default: () => []
    },
    // Настройки отображения
    optionLabel: {
        type: String,
        default: 'name'
    },
    optionValue: {
        type: String,
        default: 'id'
    },
    placeholder: {
        type: String,
        default: 'Select users...'
    },
    filterPlaceholder: {
        type: String,
        default: 'Search users...'
    },
    maxSelectedLabels: {
        type: Number,
        default: 2
    },
    selectedItemsLabel: {
        type: String,
        default: '{0} users selected'
    },
    // Поведение
    showClear: {
        type: Boolean,
        default: true
    },
    disabled: {
        type: Boolean,
        default: false
    },
    invalid: {
        type: Boolean,
        default: false
    },
    // Дополнительные настройки отображения
    showId: {
        type: Boolean,
        default: false
    },
    showRole: {
        type: Boolean,
        default: true
    },
    customValueTemplate: {
        type: Boolean,
        default: false
    },
    // CSS классы
    wrapperClass: {
        type: String,
        default: ''
    },
    // Сообщения
    emptyMessage: {
        type: String,
        default: 'No users found'
    },
    emptyFilterMessage: {
        type: String,
        default: 'No users match your search'
    },
    // Настройки пагинации
    pageSize: {
        type: Number,
        default: 20
    }
});

const emit = defineEmits(['update:modelValue', 'change', 'show', 'hide']);
const users = ref([]);
const loading = ref(false);
const isInitialLoading = ref(false);
const currentPage = ref(1);
const hasMore = ref(true);
const searchQuery = ref('');
const isDropdownOpen = ref(false);

// Кеш для пользователей
const userCache = new Map();
const loadedUserIds = new Set();

// Внутренний массив ID для работы с MultiSelect
const internalSelectedIds = ref([]);

// Основной computed для selectedUsers - теперь всегда работает с полными объектами
const selectedUsers = computed({
    get: () => props.modelValue,
    set: (userObjects) => emit('update:modelValue', userObjects)
});

// Синхронизируем внутренние ID с внешними объектами
watch(() => props.modelValue, (newUsers) => {
    if (Array.isArray(newUsers)) {
        console.log(newUsers)
        const newIds = newUsers.map(user => user[props.optionValue]);
        if (!arraysEqual(internalSelectedIds.value, newIds)) {
            internalSelectedIds.value = newIds;
            // Кешируем объекты
            newUsers.forEach(user => {
                userCache.set(user[props.optionValue], user);
                loadedUserIds.add(user[props.optionValue]);
            });
        }
    }
}, { immediate: true, deep: true });

// Когда изменяются внутренние ID, обновляем внешние объекты
watch(internalSelectedIds, async (newIds, oldIds) => {
    if (!arraysEqual(newIds, oldIds)) {
        await loadSelectedUsersIfNeeded(newIds);
        const userObjects = newIds.map(id => userCache.get(id)).filter(Boolean);
        selectedUsers.value = userObjects;
    }
});

const virtualScrollerOptions = computed(() => ({
    lazy: true,
    onLazyLoad: onLazyLoad,
    itemSize: 48,
    showLoader: true,
    loading: loading.value,
    delay: 250
}));

onMounted(async () => {
    await loadInitialData();
});

// Простая функция сравнения массивов
function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
}

async function loadInitialData() {
    // Если modelValue содержит объекты, извлекаем ID и кешируем объекты
    if (props.modelValue?.length) {
        isInitialLoading.value = true;

        const initialIds = props.modelValue.map(user => {
            // Кешируем переданные объекты
            userCache.set(user[props.optionValue], user);
            loadedUserIds.add(user[props.optionValue]);
            return user[props.optionValue];
        });

        internalSelectedIds.value = initialIds;
        await loadSelectedUsersIfNeeded(initialIds);
        isInitialLoading.value = false;
    }

    // Проверяем, есть ли уже пользователи в сторе
    const existingUsers = storage.getters['users/allUsers'];
    if (existingUsers.length === 0) {
        // Если пользователей нет, загружаем всех
        await storage.dispatch('users/fetchAllUsers');
    }

    // Загружаем основной список по роли
    await loadUsers(1, '');
}

async function loadSelectedUsersIfNeeded(selectedIds) {
    if (!selectedIds || selectedIds.length === 0) return;

    // Проверяем, какие пользователи уже загружены
    const missingIds = selectedIds.filter(id => !userCache.has(id));

    if (missingIds.length === 0) {
        updateUsersWithSelected(selectedIds);
        return;
    }

    try {
        // Загружаем только недостающих пользователей
        const loadPromises = missingIds.map(async (id) => {
            try {
                // Используем геттер для получения пользователя из стора
                let user = storage.getters['users/getUserById'](id);
                
                // Если пользователя нет в сторе, загружаем всех пользователей
                if (!user) {
                    await storage.dispatch('users/fetchAllUsers');
                    user = storage.getters['users/getUserById'](id);
                }
                
                if (user && user.role === props.role) {
                    userCache.set(id, user);
                    loadedUserIds.add(id);
                    return user;
                }
                return null;
            } catch (error) {
                console.warn(`Failed to load user with ID ${id}:`, error);
                return null;
            }
        });

        await Promise.all(loadPromises);
        updateUsersWithSelected(selectedIds);
    } catch (error) {
        console.error('Error loading selected users:', error);
    }
}

function updateUsersWithSelected(selectedIds) {
    const selectedUserObjects = selectedIds.map(id => userCache.get(id)).filter(Boolean);

    // Используем Set для быстрого поиска существующих пользователей
    const existingUserIds = new Set(users.value.map(user => user[props.optionValue]));

    // Добавляем выбранных пользователей в начало, если их еще нет
    const usersToAdd = selectedUserObjects.filter(user => !existingUserIds.has(user[props.optionValue]));

    if (usersToAdd.length > 0) {
        users.value = [...usersToAdd, ...users.value];
    }
}

async function loadUsers(page = 1, search = '') {
    if (loading.value && page > 1) return;

    loading.value = true;

    try {
        let newUsers = [];
        
        // Если это первая страница и нет поиска, попробуем использовать данные из стора
        if (page === 1 && !search) {
            const allUsers = storage.getters['users/allUsers'];
            if (allUsers.length > 0) {
                // Фильтруем пользователей по роли
                newUsers = allUsers.filter(user => user.role === props.role);
                
                // Кешируем отфильтрованных пользователей
                newUsers.forEach(user => {
                    userCache.set(user[props.optionValue], user);
                    loadedUserIds.add(user[props.optionValue]);
                });
                
                users.value = [...newUsers];
                currentPage.value = 1;
                hasMore.value = false; // Все пользователи уже загружены
                loading.value = false;
                return;
            }
        }
        
        // Если данных нет в сторе или есть поиск, загружаем с сервера
        const response = await storage.dispatch('users/fetchUsersByRole', {
            role: props.role,
            page: page,
            limit: props.pageSize,
            search: search
        });

        newUsers = response || [];

        // Кешируем загруженных пользователей
        newUsers.forEach(user => {
            userCache.set(user[props.optionValue], user);
            loadedUserIds.add(user[props.optionValue]);
        });

        // Если это новый поиск или первая страница, заменяем массив
        if (page === 1) {
            users.value = [...newUsers];
            currentPage.value = 1;

            // Если у нас есть выбранные пользователи и они уже загружены, добавляем их
            if (internalSelectedIds.value.length && !isInitialLoading.value) {
                updateUsersWithSelected(internalSelectedIds.value);
            }
        } else {
            // Добавляем к существующим, избегая дубликатов с помощью Set
            const existingIds = new Set(users.value.map(user => user[props.optionValue]));
            const uniqueNewUsers = newUsers.filter(user => !existingIds.has(user[props.optionValue]));
            users.value = [...users.value, ...uniqueNewUsers];
        }

        currentPage.value = page;
        hasMore.value = newUsers.length === props.pageSize;

    } catch (error) {
        console.error('Error loading users:', error);
    } finally {
        loading.value = false;
    }
}

// Дебаунс для поиска
let filterTimeout = null;
async function onFilter(event) {
    const query = event.value || '';

    if (filterTimeout) {
        clearTimeout(filterTimeout);
    }

    filterTimeout = setTimeout(async () => {
        searchQuery.value = query;
        await loadUsers(1, query);
    }, 300);
}

async function onLazyLoad(event) {
    if (!hasMore.value || loading.value) return;

    const nextPage = currentPage.value + 1;
    await loadUsers(nextPage, searchQuery.value);
}

function onShow() {
    isDropdownOpen.value = true;
    emit('show');
}

function onHide() {
    isDropdownOpen.value = false;
    emit('hide');
}

function onChange(event) {
    emit('change', event);
}

function getSelectedUserObjects() {
    return internalSelectedIds.value.map(id => userCache.get(id)).filter(Boolean);
}

function getRoleSeverity(role) {
    const severities = {
        'project_manager': 'success',
        'freelancer': 'info',
        'modeller': 'warn',
        'art_director': 'danger',
        'artist': 'warning'
    };
    return severities[role] || 'secondary';
}

function getRoleDisplayName(role) {
    const names = {
        'project_manager': 'Project Manager',
        'freelancer': 'Freelancer',
        'modeller': 'Modeller',
        'art_director': 'Art Director',
        'artist': 'Artist'
    };
    return names[role] || role;
}

// Функция для установки выбранных пользователей
const setSelectedUsers = async (input) => {
    if (!input || input.length === 0) {
        selectedUsers.value = [];
        return;
    }

    // Если передали массив объектов
    if (typeof input[0] === 'object') {
        selectedUsers.value = input;
    } else {
        // Если передали массив ID, загружаем пользователей
        await loadSelectedUsersIfNeeded(input);
        const userObjects = input.map(id => userCache.get(id)).filter(Boolean);
        selectedUsers.value = userObjects;
    }
};

defineExpose({
    setSelectedUsers,
    selectedUsers: readonly(selectedUsers),
    getSelectedUserObjects
});
</script>


<style scoped>
.loading-selected {
    color: #6c757d;
    font-style: italic;
    padding: 0.5rem;
}

.user-multiselect-wrapper .p-multiselect:disabled {
    opacity: 0.7;
}
.user-multiselect-wrapper {
    width: 100%;
}

.user-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    width: 100%;
}

.user-info {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
}

.user-name {
    font-weight: 500;
    color: var(--text-color);
}

.user-id {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
    margin-top: 0.25rem;
}

.user-role-tag {
    font-size: 0.75rem;
    margin-left: 0.5rem;
}

.selected-users-display {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.25rem;
}

.selected-user-item {
    background: var(--primary-color);
    color: var(--primary-color-text);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    white-space: nowrap;
}

.remaining-count {
    color: var(--text-color-secondary);
    font-size: 0.75rem;
    margin-left: 0.25rem;
}

.placeholder-text {
    color: var(--text-color-secondary);
}

.empty-filter-message,
.empty-message {
    padding: 1rem;
    text-align: center;
    color: var(--text-color-secondary);
}

/* Кастомные стили для лучшего отображения */
:deep(.p-multiselect-panel) {
    min-width: 300px;
}

:deep(.p-multiselect-items-wrapper) {
    max-height: 300px;
}

:deep(.p-multiselect-item) {
    padding: 0.5rem 1rem;
    border: none;
}

:deep(.p-multiselect-item:hover) {
    background: var(--surface-hover);
}

:deep(.p-multiselect-item.p-highlight) {
    background: var(--primary-color);
    color: var(--primary-color-text);
}

:deep(.p-multiselect-token) {
    background: var(--primary-color);
    color: var(--primary-color-text);
}

:deep(.p-multiselect-token-icon) {
    color: var(--primary-color-text);
}
</style>
