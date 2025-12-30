<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';
import { updateBatch, getBatchCalculator, createBatchCalculator, updateBatchCalculator, deleteBatchCalculator } from '../../repositories/batchesRepository';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  batch: {
    type: Object,
    default: null,
  },
  project: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['update:visible', 'batch-updated']);

const internalVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const store = useStore();
const toast = useToast();

const form = reactive({
  name: '',
  batchDate: new Date(),
  statusDurations: [],
});

const isSubmitting = ref(false);
const isLoading = ref(false);
const draggedIndex = ref(null);
const batchCalculatorId = ref(null);

const statuses = computed(() => store.state.statuses.items);
const hasValidBatchDate = computed(() => form.batchDate instanceof Date && !Number.isNaN(form.batchDate?.getTime?.()));

const formatDateForApi = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toDateInstance = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const resetForm = () => {
  form.name = '';
  form.batchDate = new Date();
  form.statusDurations = [];
  batchCalculatorId.value = null;
};

const loadBatchData = async () => {
  if (!props.batch || !props.project) {
    resetForm();
    return;
  }

  form.name = props.batch.name || '';
  form.batchDate = toDateInstance(props.batch.batchDate) ?? new Date();
  isLoading.value = true;
  
  try {
    // Загружаем batch calculator
    try {
      const calculator = await getBatchCalculator(props.batch.id);
      
      if (calculator && calculator.statusDurations) {
        batchCalculatorId.value = calculator.id;
        form.statusDurations = calculator.statusDurations.map(sd => ({
          status: sd.status,
          duration: sd.duration,
        }));
      } else {
        form.statusDurations = [];
        batchCalculatorId.value = null;
      }
    } catch (error) {
      // Если калькулятор не найден (404), это нормально - просто оставляем пустым
      if (error.response?.status !== 404) {
        throw error;
      }
      form.statusDurations = [];
      batchCalculatorId.value = null;
    }
  } catch (error) {
    // Ошибки загрузки калькулятора не должны пугать пользователя
    console.error('Failed to load batch data', error);
    form.statusDurations = [];
    batchCalculatorId.value = null;
  } finally {
    isLoading.value = false;
  }
};

const addStatusDuration = () => {
  form.statusDurations.push({
    status: null,
    duration: 1,
  });
};

const removeStatusDuration = (index) => {
  form.statusDurations.splice(index, 1);
};

const moveStatusDuration = (fromIndex, toIndex) => {
  const item = form.statusDurations.splice(fromIndex, 1)[0];
  form.statusDurations.splice(toIndex, 0, item);
};

const handleDragStart = (index) => {
  draggedIndex.value = index;
};

const handleDragOver = (event, index) => {
  event.preventDefault();
  if (draggedIndex.value === null || draggedIndex.value === index) return;
  
  const draggedItem = form.statusDurations[draggedIndex.value];
  const targetItem = form.statusDurations[index];
  
  if (draggedItem && targetItem) {
    moveStatusDuration(draggedIndex.value, index);
    draggedIndex.value = index;
  }
};

const handleDragEnd = () => {
  draggedIndex.value = null;
};

const isFormValid = computed(() => {
  const hasName = !!form.name.trim();
  if (!hasName || !hasValidBatchDate.value) {
    return false;
  }

  if (form.statusDurations.length === 0) {
    return true;
  }

  return form.statusDurations.every(
    (sd) => sd.status && Number(sd.duration) > 0,
  );
});

watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      await loadBatchData();
      // Загружаем статусы, если они еще не загружены
      if (!store.state.statuses.hasLoaded) {
        store.dispatch('statuses/fetchAll');
      }
    } else {
      resetForm();
    }
  },
);

watch(
  () => props.batch,
  async () => {
    if (props.visible && props.batch) {
      await loadBatchData();
    }
  },
);

const handleSubmit = async () => {
  if (!form.name.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Name is required',
      detail: 'Enter a batch name.',
      life: 4000,
    });
    return;
  }

  const hasCalculator = form.statusDurations.length > 0;
  if (hasCalculator) {
    const invalidStatus = form.statusDurations.find(
      (sd) => !sd.status || Number(sd.duration) <= 0,
    );
    if (invalidStatus) {
      toast.add({
        severity: 'warn',
        summary: 'Check the data',
        detail:
          'All statuses must be selected and duration must be greater than 0.',
        life: 4000,
      });
      return;
    }
  }

  if (!props.batch?.id || !props.project?.id) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Batch or project not selected.',
      life: 5000,
    });
    return;
  }

  if (!hasValidBatchDate.value) {
    toast.add({
      severity: 'warn',
      summary: 'Batch date is required',
      detail: 'Select a valid batch date.',
      life: 4000,
    });
    return;
  }

  isSubmitting.value = true;
  try {
    // Обновляем батч
    await updateBatch(props.batch.id, {
      name: form.name.trim(),
      batchDate: formatDateForApi(form.batchDate),
    });

    // Обновляем или создаем калькулятор
    if (hasCalculator) {
      const calculatorPayload = {
        batchId: props.batch.id,
        projectId: props.project.id,
        statusDurations: form.statusDurations.map((sd) => ({
          status: sd.status,
          duration: sd.duration,
        })),
      };

      if (batchCalculatorId.value) {
        // Обновляем существующий калькулятор
        await updateBatchCalculator(batchCalculatorId.value, calculatorPayload);
      } else {
        // Создаем новый калькулятор
        const created = await createBatchCalculator(calculatorPayload);
        batchCalculatorId.value = created.id;
      }
    } else if (batchCalculatorId.value) {
      // Если статусы удалены, удаляем калькулятор
      await deleteBatchCalculator(batchCalculatorId.value);
      batchCalculatorId.value = null;
    }

    toast.add({
      severity: 'success',
      summary: 'Batch updated',
      detail: `"${form.name}" updated successfully.`,
      life: 3000,
    });
    
    emit('batch-updated', props.project.id);
    internalVisible.value = false;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Failed to update batch',
      detail: error.message ?? 'Try again.',
      life: 6000,
    });
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <Dialog
    v-model:visible="internalVisible"
    header="Batch info"
    modal
    dismissableMask
    :draggable="false"
    blockScroll
    class="edit-batch-dialog"
    :style="{ width: '720px', maxWidth: '95vw' }"
  >
    <div v-if="isLoading" class="text-center py-5">
      <i class="pi pi-spin pi-spinner fs-4 d-block mb-2"></i>
      <span>Loading data...</span>
    </div>

    <form v-else class="d-flex flex-column gap-4" @submit.prevent="handleSubmit">
      <div>
        <label class="form-label fw-semibold">Batch name</label>
        <InputText
          v-model="form.name"
          class="w-100"
          placeholder="Enter batch name"
          autocomplete="off"
        />
      </div>

      <div>
        <label class="form-label fw-semibold">Batch date</label>
        <DatePicker
          v-model="form.batchDate"
          dateFormat="yy-mm-dd"
          showIcon
          iconDisplay="input"
          placeholder="Select a date"
          :class="['w-100', { 'p-invalid': !hasValidBatchDate }]"
        />
      </div>

      <div>
        <div class="d-flex align-items-center justify-content-between mb-3">
          <label class="form-label fw-semibold mb-0">Batch Calculator (optional)</label>
          <Button
            type="button"
            icon="pi pi-plus"
            label="Add status"
            size="small"
            @click="addStatusDuration"
          />
        </div>

        <div v-if="form.statusDurations.length === 0" class="text-center py-4 text-muted border rounded">
          <i class="pi pi-info-circle d-block mb-2"></i>
          <span>No statuses added yet. This is optional.</span>
        </div>

        <div v-else class="d-flex flex-column gap-2">
          <div
            v-for="(statusDuration, index) in form.statusDurations"
            :key="index"
            class="batch-calculator-item p-3 border rounded d-flex align-items-center gap-3"
            :class="{ 'dragging': draggedIndex === index }"
            draggable="true"
            @dragstart="handleDragStart(index)"
            @dragover="handleDragOver($event, index)"
            @dragend="handleDragEnd"
          >
            <div class="drag-handle cursor-move">
              <i class="pi pi-bars text-muted"></i>
            </div>
            
            <div class="flex-grow-1 d-flex gap-3">
              <div class="flex-grow-1">
                <label class="form-label small mb-1">Status</label>
                <Select
                  v-model="statusDuration.status"
                  :options="statuses"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="Select a status"
                  class="w-100"
                />
              </div>
              
              <div style="width: 150px;">
                <label class="form-label small mb-1">Duration</label>
                <InputNumber
                  v-model="statusDuration.duration"
                  :min="1"
                  :max="9999"
                  class="w-100"
                  placeholder="Days"
                />
              </div>
            </div>
            
            <Button
              type="button"
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              @click="removeStatusDuration(index)"
            />
          </div>
        </div>
      </div>

      <div class="d-flex justify-content-end gap-2">
        <Button type="button" label="Cancel" severity="secondary" class="px-4" @click="internalVisible = false" />
        <Button
          type="submit"
          label="Save"
          class="px-4"
          :disabled="!isFormValid || isSubmitting"
          :loading="isSubmitting"
        />
      </div>
    </form>
  </Dialog>
</template>

<style scoped>
.edit-batch-dialog :deep(.p-dialog-content) {
  padding-top: 0.75rem;
}

.form-label {
  color: #475569;
}

.batch-calculator-item {
  background-color: #f8fafc;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.batch-calculator-item:hover {
  background-color: #f1f5f9;
}

.batch-calculator-item.dragging {
  opacity: 0.5;
  transform: scale(0.98);
}

.drag-handle {
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

.cursor-move {
  cursor: move;
}

form :deep(.p-inputtext),
form :deep(.p-select),
form :deep(.p-inputnumber) {
  width: 100%;
}
</style>

