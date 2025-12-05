<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';

const DEFAULT_COLOR = '#2563eb';
const LIGHT_TEXT = '#ffffff';
const DARK_TEXT = '#111827';

const store = useStore();
const toast = useToast();
const confirm = useConfirm();

const searchTerm = ref('');
const isCreateModalVisible = ref(false);

const createForm = reactive({
  name: '',
  color: DEFAULT_COLOR,
});

const editingRow = reactive({
  id: null,
  name: '',
  color: DEFAULT_COLOR,
});

const computeTextColor = (hex) => {
  if (!hex) return LIGHT_TEXT;
  let color = hex.replace('#', '');
  if (color.length === 3) {
    color = color.split('').map((c) => c + c).join('');
  }
  if (color.length !== 6) return LIGHT_TEXT;
  const r = parseInt(color.slice(0, 2), 16);
  const g = parseInt(color.slice(2, 4), 16);
  const b = parseInt(color.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.65 ? DARK_TEXT : LIGHT_TEXT;
};

const statuses = computed(() => store.state.statuses.items);
const isLoading = computed(() => store.state.statuses.isLoading);
const isSaving = computed(() => store.state.statuses.isSaving);
const hasLoaded = computed(() => store.state.statuses.hasLoaded);
const canCreate = computed(() => !!createForm.name.trim());
const canInlineSave = computed(() => !!editingRow.id && !!editingRow.name.trim());

const filteredStatuses = computed(() => {
  const term = searchTerm.value.trim().toLowerCase();
  if (!term) return statuses.value;
  return statuses.value.filter((status) =>
    status.name.toLowerCase().includes(term),
  );
});

const ensureData = async () => {
  if (!hasLoaded.value) {
    try {
      await store.dispatch('statuses/fetchAll');
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Failed to load statuses',
        detail: error.message ?? 'Could not fetch statuses.',
        life: 5000,
      });
    }
  }
};

onMounted(ensureData);

const resetCreateForm = () => {
  createForm.name = '';
  createForm.color = DEFAULT_COLOR;
};

const resetEditingRow = () => {
  editingRow.id = null;
  editingRow.name = '';
  editingRow.color = DEFAULT_COLOR;
};

const openCreateModal = () => {
  resetCreateForm();
  isCreateModalVisible.value = true;
};

const handleCreateDialogHide = () => {
  resetCreateForm();
};

const buildPayload = ({ name, color }) => {
  const normalizedColor = color.startsWith('#') ? color : `#${color}`;
  return {
    name: name.trim(),
    color: normalizedColor,
    textColor: computeTextColor(normalizedColor),
  };
};

const handleCreateSubmit = async () => {
  if (!canCreate.value) return;

  const payload = buildPayload(createForm);

  try {
    await store.dispatch('statuses/create', payload);
    toast.add({
      severity: 'success',
      summary: 'Status created',
      detail: `"${payload.name}" added.`,
      life: 3000,
    });
    isCreateModalVisible.value = false;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Failed to create status',
      detail: error.message ?? 'Try again.',
      life: 5000,
    });
  }
};

const startEditing = (status) => {
  editingRow.id = status.id;
  editingRow.name = status.name;
  editingRow.color = status.color;
};

const saveEditing = async () => {
  if (!canInlineSave.value) {
    toast.add({
      severity: 'warn',
      summary: 'Check the data',
      detail: 'Status name is required.',
      life: 4000,
    });
    return;
  }

  const payload = buildPayload(editingRow);

  try {
    await store.dispatch('statuses/update', {
      id: editingRow.id,
      payload,
    });
    toast.add({
      severity: 'success',
      summary: 'Status updated',
      detail: `"${payload.name}" saved.`,
      life: 3000,
    });
    resetEditingRow();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Failed to save',
      detail: error.message ?? 'Try again.',
      life: 5000,
    });
  }
};

const cancelEditing = () => {
  resetEditingRow();
};

const confirmRemoval = (status) => {
  confirm.require({
    message: `Delete status "${status.name}"?`,
    header: 'Status deletion',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Delete',
    rejectLabel: 'Cancel',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await store.dispatch('statuses/delete', status.id);
        toast.add({
          severity: 'success',
          summary: 'Status deleted',
          detail: `"${status.name}" is no longer available.`,
          life: 3000,
        });
        if (editingRow.id === status.id) {
          resetEditingRow();
        }
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Deletion error',
          detail: error.message ?? 'Failed to delete status.',
          life: 5000,
        });
      }
    },
  });
};
</script>

<template>
  <section class="status-manager container-fluid py-3">
    <div class="card shadow-sm border-0 rounded-4">
      <div class="card-body d-flex flex-column">
        <div class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center mb-3 gap-3">
          <h5 class="mb-0">Status list</h5>
          <div class="d-flex flex-column flex-md-row align-items-stretch gap-2 w-100 w-lg-auto">
            <div class="search-box d-flex align-items-center gap-2 flex-grow-1">
              <span class="pi pi-search text-muted"></span>
              <InputText
                v-model="searchTerm"
                placeholder="Search by name"
                class="flex-grow-1"
              />
            </div>
            <Button
              type="button"
              label="Create status"
              icon="pi pi-plus"
              class="ms-md-2"
              @click="openCreateModal"
            />
          </div>
        </div>

        <DataTable
          :value="filteredStatuses"
          :loading="isLoading"
          dataKey="id"
          scrollable
          scrollHeight="440px"
          class="status-table flex-grow-1"
        >
          <Column field="name" header="Name" sortable>
            <template #body="{ data }">
              <div v-if="editingRow.id === data.id" class="inline-input">
                <InputText
                  v-model.trim="editingRow.name"
                  placeholder="Status name"
                  :disabled="isSaving"
                />
              </div>
              <span v-else>{{ data.name }}</span>
            </template>
          </Column>

          <Column header="Color">
            <template #body="{ data }">
              <div v-if="editingRow.id === data.id" class="d-flex align-items-center gap-3">
                <div class="color-input border rounded-3 px-3 py-2 d-flex align-items-center justify-content-between flex-grow-1">
                  <ColorPicker
                    v-model="editingRow.color"
                    format="hex"
                    class="me-2"
                    :disabled="isSaving"
                  />
                  <span class="small text-muted">{{ editingRow.color }}</span>
                </div>
              </div>
              <div v-else class="d-flex align-items-center gap-2">
                <span class="color-dot rounded-circle" :style="{ backgroundColor: data.color }"></span>
                <span class="fw-semibold" :style="{ color: data.color }">{{ data.color }}</span>
              </div>
            </template>
          </Column>

          <Column header="Actions" class="text-end">
            <template #body="{ data }">
              <div v-if="editingRow.id === data.id" class="d-flex gap-2 justify-content-end">
                <Button
                  icon="pi pi-check"
                  severity="success"
                  rounded
                  size="small"
                  :disabled="!canInlineSave || isSaving"
                  :loading="isSaving"
                  @click="saveEditing"
                />
                <Button
                  icon="pi pi-times"
                  severity="secondary"
                  rounded
                  size="small"
                  outlined
                  :disabled="isSaving"
                  @click="cancelEditing"
                />
              </div>
              <div v-else class="d-flex gap-2 justify-content-end">
                <Button
                  icon="pi pi-pencil"
                  severity="secondary"
                  rounded
                  size="small"
                  outlined
                  @click="startEditing(data)"
                />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  rounded
                  size="small"
                  outlined
                  @click="confirmRemoval(data)"
                />
              </div>
            </template>
          </Column>

          <template #empty>
            <div class="text-center text-muted py-4">
            No matching statuses.
            </div>
          </template>
        </DataTable>
      </div>
    </div>

    <Dialog
      v-model:visible="isCreateModalVisible"
      modal
      header="Create status"
      :style="{ width: '420px' }"
      :draggable="false"
      @hide="handleCreateDialogHide"
    >
      <form class="d-flex flex-column gap-3" @submit.prevent="handleCreateSubmit">
        <div>
          <label class="form-label fw-semibold">Name</label>
          <InputText
            v-model.trim="createForm.name"
            placeholder="Status name"
            class="w-100"
            :disabled="isSaving"
          />
        </div>

        <div>
          <label class="form-label fw-semibold">Color</label>
          <div class="color-input border rounded-3 px-3 py-2 d-flex align-items-center justify-content-between">
            <ColorPicker
              v-model="createForm.color"
              format="hex"
              class="me-2"
              :disabled="isSaving"
            />
            <span class="small text-muted">{{ createForm.color }}</span>
          </div>
        </div>
      </form>

      <template #footer>
        <div class="d-flex justify-content-end gap-2">
          <Button
            label="Cancel"
            severity="secondary"
            outlined
            @click="isCreateModalVisible = false"
          />
          <Button
            label="Create"
            icon="pi pi-check"
            :loading="isSaving"
            :disabled="!canCreate || isSaving"
            @click="handleCreateSubmit"
          />
        </div>
      </template>
    </Dialog>
  </section>
</template>

<style scoped>
.status-manager {
  background-color: transparent;
}

.color-dot {
  width: 16px;
  height: 16px;
  border: 1px solid rgba(15, 23, 42, 0.2);
}

.search-box {
  max-width: 320px;
}

.inline-input :deep(.p-inputtext) {
  width: 100%;
}
</style>

