<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';
import DatePicker from 'primevue/datepicker';
import MultiSelect from 'primevue/multiselect';
import ToggleSwitch from 'primevue/toggleswitch';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:visible']);

const internalVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const store = useStore();
const toast = useToast();

const createDefaultForm = () => ({
  name: '',
  isActive: true,
  startDate: null,
  endDate: null,
  clientName: '',
  deadlineType: 'soft',
  projectManagers: [],
});

const form = reactive(createDefaultForm());
const isSubmitting = ref(false);
const managerOptions = ref([]);
const isManagersLoading = ref(false);
let managerFilterTimer;

const deadlineOptions = [
  { label: 'Flexible (soft)', value: 'soft' },
  { label: 'Strict (hard)', value: 'hard' },
];

const dateError = computed(() => {
  if (form.startDate && form.endDate && form.endDate < form.startDate) {
    return 'End date cannot be before start date';
  }
  return '';
});

const resetForm = () => {
  Object.assign(form, createDefaultForm());
};

const formatDate = (value) => {
  if (!value) return null;
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const mergeManagerOptions = (users = []) => {
  const map = new Map(managerOptions.value.map((user) => [user.id, user]));
  users.forEach((user) => {
    if (user?.id) {
      map.set(user.id, user);
    }
  });
  managerOptions.value = Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name, 'ru'),
  );
};

const fetchManagers = async (search = '') => {
  isManagersLoading.value = true;
  try {
    const items = await store.dispatch('users/searchProjectManagers', {
      search,
      limit: 10,
    });
    mergeManagerOptions(items ?? []);
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Failed to load managers',
      detail: error.message ?? 'Try again.',
      life: 5000,
    });
  } finally {
    isManagersLoading.value = false;
  }
};

const handleManagersFilter = (event) => {
  const term = event.value ?? '';
  if (managerFilterTimer) {
    clearTimeout(managerFilterTimer);
  }
  managerFilterTimer = setTimeout(() => fetchManagers(term), 350);
};

onBeforeUnmount(() => {
  if (managerFilterTimer) {
    clearTimeout(managerFilterTimer);
  }
});

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      fetchManagers();
    } else {
      resetForm();
    }
  },
);

const isSubmitDisabled = computed(() => !form.name.trim() || isSubmitting.value);

const buildPayload = () => ({
  name: form.name.trim(),
  isActive: form.isActive,
  clientName: form.clientName.trim() || null,
  startDate: formatDate(form.startDate),
  endDate: formatDate(form.endDate),
  deadlineType: form.deadlineType,
});

const handleSubmit = async () => {
  if (!form.name.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Name is required',
      detail: 'Enter a project name.',
      life: 4000,
    });
    return;
  }

  if (dateError.value) {
    toast.add({
      severity: 'warn',
      summary: 'Check dates',
      detail: dateError.value,
      life: 4000,
    });
    return;
  }

  isSubmitting.value = true;
  try {
    const payload = buildPayload();
    const created = await store.dispatch('projects/create', payload);
    let finalProject = created;
    if (form.projectManagers.length) {
      finalProject = await store.dispatch('projects/attachManagers', {
        projectId: created.id,
        userIds: form.projectManagers,
      });
    }

    toast.add({
      severity: 'success',
      summary: 'Project created',
      detail: `"${finalProject.name}" created successfully.`,
      life: 3000,
    });
    internalVisible.value = false;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Failed to create project',
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
    header="Create project"
    modal
    dismissableMask
    :draggable="false"
    blockScroll
    class="create-project-dialog"
    :style="{ width: '720px', maxWidth: '95vw' }"
  >
    <form class="d-flex flex-column gap-4" @submit.prevent="handleSubmit">
      <div class="row g-3">
        <div class="col-md-8">
          <label class="form-label fw-semibold">Project name</label>
          <InputText
            v-model="form.name"
            class="w-100"
            placeholder="Example: Fortes Vision"
            autocomplete="off"
          />
        </div>
        <div class="col-md-4">
          <label class="form-label fw-semibold d-block">Status</label>
          <div class="d-flex align-items-center gap-2">
            <ToggleSwitch inputId="create-project-active" v-model="form.isActive" />
            <label class="mb-0 text-muted" for="create-project-active">
              {{ form.isActive ? 'Active' : 'Paused' }}
            </label>
          </div>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label fw-semibold">Start date</label>
          <DatePicker
            v-model="form.startDate"
            showIcon
            iconDisplay="input"
            dateFormat="dd.mm.yy"
            class="w-100"
            placeholder="Not selected"
          />
        </div>
        <div class="col-md-6">
          <label class="form-label fw-semibold">End date</label>
          <DatePicker
            v-model="form.endDate"
            showIcon
            iconDisplay="input"
            dateFormat="dd.mm.yy"
            class="w-100"
            placeholder="Not selected"
          />
          <small v-if="dateError" class="text-danger">{{ dateError }}</small>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label fw-semibold">Client</label>
          <InputText
            v-model="form.clientName"
            class="w-100"
            placeholder="Client name"
            autocomplete="off"
          />
        </div>
        <div class="col-md-6">
          <label class="form-label fw-semibold">Deadline type</label>
          <Select
            v-model="form.deadlineType"
            :options="deadlineOptions"
            optionLabel="label"
            optionValue="value"
            class="w-100"
          />
        </div>
      </div>

      <div>
        <label class="form-label fw-semibold d-block">Project managers</label>
        <MultiSelect
          v-model="form.projectManagers"
          :options="managerOptions"
          optionLabel="name"
          optionValue="id"
          display="chip"
          filter
          :loading="isManagersLoading"
          class="w-100"
          placeholder="Select managers"
          filterPlaceholder="Search by name"
          :maxSelectedLabels="3"
          @filter="handleManagersFilter"
        />
        <small class="text-muted">

        </small>
      </div>

      <div class="d-flex justify-content-end gap-2">
        <Button type="button" label="Cancel" severity="secondary" class="px-4" @click="internalVisible = false" />
        <Button
          type="submit"
          label="Create"
          class="px-4"
          :disabled="isSubmitDisabled || Boolean(dateError)"
          :loading="isSubmitting"
        />
      </div>
    </form>
  </Dialog>
</template>

<style scoped>
.create-project-dialog :deep(.p-dialog-content) {
  padding-top: 0.75rem;
}

.form-label {
  color: #475569;
}

form :deep(.p-inputtext),
form :deep(.p-multiselect),
form :deep(.p-select),
form :deep(.p-datepicker) {
  width: 100%;
}
</style>


