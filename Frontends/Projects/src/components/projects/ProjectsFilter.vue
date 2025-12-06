<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import DatePicker from 'primevue/datepicker';

const store = useStore();
const emit = defineEmits(['filter-change']);

// Состояние фильтров
const isOpen = ref(false);
const expandedSections = ref({
  projectManagers: false,
  projectStatus: false,
  deadlineType: false,
  dateRange: false,
});

// Значения фильтров
const selectedManagers = ref([]);
const selectedProjectStatus = ref([]);
const selectedDeadlineTypes = ref([]);
const dateRange = ref(null);

// Поиск в фильтрах
const managerSearchQuery = ref('');
const isSearchingManagers = ref(false);
const managerSearchTimeout = ref(null);

// Данные для фильтров
const projectManagers = computed(() => store.state.users.projectManagers || []);

// Фильтрованные проджект менеджеры для поиска
const filteredManagers = computed(() => projectManagers.value);

// Поиск менеджеров через API
const searchManagers = async (searchValue) => {
  if (managerSearchTimeout.value) {
    clearTimeout(managerSearchTimeout.value);
  }

  managerSearchTimeout.value = setTimeout(async () => {
    isSearchingManagers.value = true;
    try {
      console.log('[ProjectsFilter] Поиск менеджеров по запросу:', searchValue);
      await store.dispatch('users/fetchProjectManagers', searchValue);
    } catch (error) {
      console.error('[ProjectsFilter] Ошибка поиска менеджеров:', error);
    } finally {
      isSearchingManagers.value = false;
    }
  }, 300);
};

// Обработчик изменения поискового запроса
const handleManagerSearchInput = (event) => {
  const value = event.target.value;
  managerSearchQuery.value = value;
  searchManagers(value);
};

// Опции для статуса проекта
const projectStatusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

// Опции для типа дедлайна
const deadlineTypeOptions = [
  { label: 'Hard Deadline', value: 'hard' },
  { label: 'Soft Deadline', value: 'soft' },
];

// Переключение видимости главного меню
const toggleFilter = () => {
  isOpen.value = !isOpen.value;
};

// Переключение секций
const toggleSection = async (section) => {
  expandedSections.value[section] = !expandedSections.value[section];
  
  // Загружаем менеджеров при открытии секции, если еще не загружены
  if (section === 'projectManagers' && expandedSections.value[section]) {
    console.log('[ProjectsFilter] Открыта секция проджект менеджеров, текущее количество:', projectManagers.value.length);
    if (projectManagers.value.length === 0) {
      console.log('[ProjectsFilter] Загружаем менеджеров по API...');
      await store.dispatch('users/fetchProjectManagers', '');
      console.log('[ProjectsFilter] Менеджеры загружены:', store.state.users.projectManagers);
    }
  }
};

// Выбор/снятие выбора менеджера
const toggleManager = (managerId) => {
  const index = selectedManagers.value.indexOf(managerId);
  if (index > -1) {
    selectedManagers.value.splice(index, 1);
  } else {
    selectedManagers.value.push(managerId);
  }
};

// Выбор/снятие выбора статуса проекта
const toggleProjectStatus = (statusValue) => {
  const index = selectedProjectStatus.value.indexOf(statusValue);
  if (index > -1) {
    selectedProjectStatus.value.splice(index, 1);
  } else {
    selectedProjectStatus.value.push(statusValue);
  }
};

// Выбор/снятие выбора типа дедлайна
const toggleDeadlineType = (typeValue) => {
  const index = selectedDeadlineTypes.value.indexOf(typeValue);
  if (index > -1) {
    selectedDeadlineTypes.value.splice(index, 1);
  } else {
    selectedDeadlineTypes.value.push(typeValue);
  }
};

// Проверка выбран ли элемент
const isManagerSelected = (managerId) => selectedManagers.value.includes(managerId);
const isProjectStatusSelected = (statusValue) => selectedProjectStatus.value.includes(statusValue);
const isDeadlineTypeSelected = (typeValue) => selectedDeadlineTypes.value.includes(typeValue);

// Получить имя менеджера по ID
const getManagerName = (managerId) => {
  const manager = projectManagers.value.find(pm => pm.id === managerId);
  return manager ? manager.name : '';
};

// Сброс всех фильтров
const clearAllFilters = () => {
  selectedManagers.value = [];
  selectedProjectStatus.value = [];
  selectedDeadlineTypes.value = [];
  dateRange.value = null;
  managerSearchQuery.value = '';
  emitFilterChange();
};

// Проверка есть ли активные фильтры
const hasActiveFilters = computed(() => {
  return selectedManagers.value.length > 0 ||
         selectedProjectStatus.value.length > 0 ||
         selectedDeadlineTypes.value.length > 0 ||
         (dateRange.value !== null && dateRange.value.length > 0);
});

// Получить количество активных фильтров
const activeFiltersCount = computed(() => {
  let count = 0;
  if (selectedManagers.value.length > 0) count++;
  if (selectedProjectStatus.value.length > 0) count++;
  if (selectedDeadlineTypes.value.length > 0) count++;
  if (dateRange.value !== null && dateRange.value.length > 0) count++;
  return count;
});

// Конвертировать дату в формат YYYY-MM-DD
const formatDateToString = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Эмитить изменение фильтров
const emitFilterChange = () => {
  const filters = {
    managerIds: selectedManagers.value,
    projectStatus: selectedProjectStatus.value,
    deadlineTypes: selectedDeadlineTypes.value,
    dateFrom: dateRange.value && dateRange.value[0] ? formatDateToString(dateRange.value[0]) : null,
    dateTo: dateRange.value && dateRange.value[1] ? formatDateToString(dateRange.value[1]) : null,
  };
  console.log('[ProjectsFilter] Эмитим фильтры:', filters);
  emit('filter-change', filters);
};

// Следить за изменениями фильтров
watch([selectedManagers, selectedProjectStatus, selectedDeadlineTypes, dateRange], () => {
  emitFilterChange();
}, { deep: true });


// Закрытие при клике вне
const filterRef = ref(null);
const handleClickOutside = (event) => {
  if (filterRef.value && !filterRef.value.contains(event.target)) {
    isOpen.value = false;
  }
};

onMounted(async () => {
  document.addEventListener('click', handleClickOutside);
  // Загружаем менеджеров сразу при монтировании
  console.log('[ProjectsFilter] Компонент смонтирован, загружаем менеджеров...');
  await store.dispatch('users/fetchProjectManagers', '');
  console.log('[ProjectsFilter] Менеджеры после загрузки:', projectManagers.value);
});

defineExpose({
  clearAllFilters,
});
</script>

<template>
  <div class="projects-filter" ref="filterRef">
    <div class="filter-trigger" @click.stop="toggleFilter">
      <div class="position-relative w-100">
        <i class="pi pi-filter position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
        <div class="filter-input w-100 ps-5 pe-4">
          <span v-if="!hasActiveFilters" class="text-muted">Filters...</span>
          <span v-else class="text-primary">
            Filters: {{ activeFiltersCount }}
          </span>
        </div>
        <i 
          class="pi position-absolute top-50 end-0 translate-middle-y me-3"
          :class="isOpen ? 'pi-chevron-up' : 'pi-chevron-down'"
          style="font-size: 0.75rem;"
        ></i>
      </div>
    </div>

    <!-- Каскадное меню фильтров -->
    <div v-if="isOpen" class="filter-dropdown" @click.stop>
        <div class="filter-header">
          <span class="fw-semibold">Filters</span>
          <button 
            v-if="hasActiveFilters"
            @click="clearAllFilters" 
            class="btn-clear"
          >
            <i class="pi pi-times me-1"></i>
            Clear
          </button>
        </div>

        <div class="filter-sections">
          <!-- Фильтр по проджект менеджерам -->
          <div class="filter-section">
            <div 
              class="filter-section-header"
              @click="toggleSection('projectManagers')"
            >
              <div class="d-flex align-items-center">
                <i class="pi pi-users me-2"></i>
                <span>Project Managers</span>
                <span v-if="selectedManagers.length > 0" class="filter-badge ms-2">
                  {{ selectedManagers.length }}
                </span>
              </div>
              <i 
                class="pi"
                :class="expandedSections.projectManagers ? 'pi-chevron-up' : 'pi-chevron-down'"
              ></i>
            </div>
            
            <div v-if="expandedSections.projectManagers" class="filter-section-content">
                <!-- Поиск менеджеров -->
                <div class="filter-search">
                  <i class="pi pi-search"></i>
                  <input 
                    v-model="managerSearchQuery"
                    type="text"
                    placeholder="Search..."
                    @click.stop
                    @input="handleManagerSearchInput"
                  />
                  <i v-if="isSearchingManagers" class="pi pi-spin pi-spinner search-spinner"></i>
                </div>

                <!-- Список менеджеров -->
                <div class="filter-options">
                  <div 
                    v-for="manager in filteredManagers"
                    :key="manager.id"
                    class="filter-option"
                    @click="toggleManager(manager.id)"
                  >
                    <div class="filter-checkbox">
                      <i 
                        class="pi"
                        :class="isManagerSelected(manager.id) ? 'pi-check-square' : 'pi-square'"
                      ></i>
                    </div>
                    <span>{{ manager.name }}</span>
                  </div>
                  
                  <div v-if="filteredManagers.length === 0" class="filter-empty">
                    No managers found
                  </div>
                </div>
            </div>
          </div>

          <!-- Фильтр по статусу проекта -->
          <div class="filter-section">
            <div 
              class="filter-section-header"
              @click="toggleSection('projectStatus')"
            >
              <div class="d-flex align-items-center">
                <i class="pi pi-circle me-2"></i>
                <span>Project Status</span>
                <span v-if="selectedProjectStatus.length > 0" class="filter-badge ms-2">
                  {{ selectedProjectStatus.length }}
                </span>
              </div>
              <i 
                class="pi"
                :class="expandedSections.projectStatus ? 'pi-chevron-up' : 'pi-chevron-down'"
              ></i>
            </div>
            
            <div v-if="expandedSections.projectStatus" class="filter-section-content">
                <div class="filter-options">
                  <div 
                    v-for="option in projectStatusOptions"
                    :key="option.value"
                    class="filter-option"
                    @click="toggleProjectStatus(option.value)"
                  >
                    <div class="filter-checkbox">
                      <i 
                        class="pi"
                        :class="isProjectStatusSelected(option.value) ? 'pi-check-square' : 'pi-square'"
                      ></i>
                    </div>
                    <span>{{ option.label }}</span>
                  </div>
                </div>
            </div>
          </div>

          <!-- Фильтр по типу дедлайна -->
          <div class="filter-section">
            <div 
              class="filter-section-header"
              @click="toggleSection('deadlineType')"
            >
              <div class="d-flex align-items-center">
                <i class="pi pi-clock me-2"></i>
                <span>Deadline Type</span>
                <span v-if="selectedDeadlineTypes.length > 0" class="filter-badge ms-2">
                  {{ selectedDeadlineTypes.length }}
                </span>
              </div>
              <i 
                class="pi"
                :class="expandedSections.deadlineType ? 'pi-chevron-up' : 'pi-chevron-down'"
              ></i>
            </div>
            
            <div v-if="expandedSections.deadlineType" class="filter-section-content">
                <div class="filter-options">
                  <div 
                    v-for="option in deadlineTypeOptions"
                    :key="option.value"
                    class="filter-option"
                    @click="toggleDeadlineType(option.value)"
                  >
                    <div class="filter-checkbox">
                      <i 
                        class="pi"
                        :class="isDeadlineTypeSelected(option.value) ? 'pi-check-square' : 'pi-square'"
                      ></i>
                    </div>
                    <span>{{ option.label }}</span>
                  </div>
                </div>
            </div>
          </div>

          <!-- Фильтр по дате проекта -->
          <div class="filter-section">
            <div 
              class="filter-section-header"
              @click="toggleSection('dateRange')"
            >
              <div class="d-flex align-items-center">
                <i class="pi pi-calendar me-2"></i>
                <span>Project Period</span>
                <span v-if="dateRange && dateRange.length > 0" class="filter-badge ms-2">
                  1
                </span>
              </div>
              <i 
                class="pi"
                :class="expandedSections.dateRange ? 'pi-chevron-up' : 'pi-chevron-down'"
              ></i>
            </div>
            
            <div v-if="expandedSections.dateRange" class="filter-section-content">
                <div class="date-range-picker">
                  <DatePicker
                    v-model="dateRange"
                    selectionMode="range"
                    :manualInput="false"
                    dateFormat="dd.mm.yy"
                    placeholder="Select date range"
                    :showIcon="true"
                    iconDisplay="input"
                    class="w-100"
                    @click.stop
                  />
                </div>
            </div>
          </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
.projects-filter {
  position: relative;
}

.filter-trigger {
  cursor: pointer;
  width: 100%;
}

.filter-input {
  padding: 0.5rem 2.5rem 0.5rem 2.5rem;
  border: 1px solid #ced4da;
  border-radius: 0.375rem;
  background-color: #fff;
  font-size: 0.875rem;
  line-height: 1.5;
  height: 38px;
  display: flex;
  align-items: center;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.filter-trigger:hover .filter-input {
  border-color: #86b7fe;
}

.filter-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 500px;
  overflow-y: auto;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #dee2e6;
  background-color: #f8f9fa;
}

.btn-clear {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  transition: background-color 0.15s ease;
}

.btn-clear:hover {
  background-color: #f8d7da;
}

.filter-sections {
  padding: 0.5rem 0;
}

.filter-section {
  border-bottom: 1px solid #f0f0f0;
}

.filter-section:last-child {
  border-bottom: none;
}

.filter-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
  user-select: none;
}

.filter-section-header:hover {
  background-color: #f8f9fa;
}

.filter-badge {
  background-color: #0d6efd;
  color: white;
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 1rem;
  font-weight: 600;
}

.filter-section-content {
  padding: 0.5rem 0;
  border-top: 1px solid #f0f0f0;
}

.filter-search {
  position: relative;
  padding: 0 1rem;
  margin-bottom: 0.5rem;
}

.filter-search i {
  position: absolute;
  left: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  font-size: 0.875rem;
}

.filter-search input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  outline: none;
}

.filter-search input:focus {
  border-color: #86b7fe;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

.filter-search .search-spinner {
  position: absolute;
  right: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  font-size: 0.875rem;
}

.filter-options {
  max-height: 200px;
  overflow-y: auto;
}

.filter-option {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
  user-select: none;
}

.filter-option:hover {
  background-color: #f8f9fa;
}

.filter-checkbox {
  margin-right: 0.75rem;
  color: #0d6efd;
  font-size: 1rem;
}

.filter-empty {
  padding: 1rem;
  text-align: center;
  color: #6c757d;
  font-size: 0.875rem;
}

.date-range-picker {
  padding: 0.75rem 1rem;
}

.date-range-picker :deep(.p-datepicker) {
  font-size: 0.875rem;
}

.date-range-picker :deep(.p-datepicker-input) {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

.date-range-picker :deep(.p-inputicon) {
  color: #6c757d;
}

/* Скроллбар */
.filter-dropdown::-webkit-scrollbar,
.filter-options::-webkit-scrollbar {
  width: 6px;
}

.filter-dropdown::-webkit-scrollbar-track,
.filter-options::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.filter-dropdown::-webkit-scrollbar-thumb,
.filter-options::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.filter-dropdown::-webkit-scrollbar-thumb:hover,
.filter-options::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>

