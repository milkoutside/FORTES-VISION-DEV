<template>
    <div>
        <div
            v-if="showContextMenuFlag"
            class="context-menu"
            :style="{ top: contextMenuPosition.y + 'px', left: contextMenuPosition.x + 'px' }"
            @click.stop
        >
            <div class="context-menu-header">Batch actions</div>
            <div class="context-menu-items">
                <div class="context-menu-item" @click="openBatchDialog">
                    <i class="pi pi-plus"></i>
                    <span>Create image</span>
                </div>
                <div class="context-menu-item" @click="reloadBatch">
                    <i class="pi pi-info-circle"></i>
                    <span>Reload batch</span>
                </div>
                <div class="context-menu-item" @click="confirmDeleteBatch">
                    <i class="pi pi-trash"></i>
                    <span>Delete Batch</span>
                </div>
            </div>
        </div>

        <!-- Модальное окно PrimeVue для создания батча -->
        <Dialog
            v-model:visible="showCreateImageDialog"
            modal
            header="Create new image"
            :style="{ width: '450px' }"
            :closable="true"
            :dismissableMask="true"
        >
            <div class="p-field">
                <label for="batchName" class="p-d-block">Image name</label>
                <InputText
                    id="batchName"
                    v-model="imageName"
                    type="text"
                    class="p-d-block w-full"
                    placeholder=""
                    autofocus
                />
            </div>
            <div class="p-field">
                <label for="artists" class="p-d-block">artists</label>
                <UserMultiSelect v-model="selectedArtists" role="artist" />
            </div>
            <div class="p-field">
                <label for="art_director" class="p-d-block">art directors</label>
                <UserMultiSelect v-model="selectedArtDirectors" role="art_director" />
            </div>
            <div class="p-field">
                <label for="freelancers" class="p-d-block">freelancers</label>
                <UserMultiSelect v-model="selectedFreelancers" role="freelancer" />
            </div>
            <div class="p-field">
                <label for="modellers" class="p-d-block">modellers</label>
                <UserMultiSelect v-model="selectedModellers" role="modeller" />
            </div>
            <template #footer>
                <Button
                    label="Cancel"
                    icon="pi pi-times"
                    class="p-button-text"
                    @click="closeDialog"
                />
                <Button
                    label="Create"
                    icon="pi pi-check"
                    class="p-button-primary"
                    @click="createImage"
                    :disabled="!imageName.trim()"
                />
            </template>
        </Dialog>

        <!-- ConfirmDialog для подтверждения удаления -->

    </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { useConfirm } from 'primevue/useconfirm';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import ConfirmDialog from 'primevue/confirmdialog';
import UserMultiSelect from "@/components/ui/selects/UserMultiSelect.vue";

const store = useStore();
const confirm = useConfirm();

// Получаем состояние контекстного меню из хранилища
const showContextMenuFlag = computed(() => store.getters['ui/contextMenu/batches/showContextMenu']);
const contextMenuPosition = computed(() => store.getters['ui/contextMenu/batches/contextMenuPosition']);
const selectedProjectId = computed(() => store.getters['ui/contextMenu/batches/selectedProjectId']);
const selectedBatchId = computed(() => store.getters['ui/contextMenu/batches/selectedBatchId']);

// Локальное состояние для модального окна
const showCreateImageDialog = ref(false);
const imageName = ref('');
const selectedArtists = ref([]);
const selectedArtDirectors = ref([]);
const selectedModellers = ref([]);
const selectedFreelancers = ref([]);

// Обработчик для закрытия меню при клике вне его
const handleOutsideClick = (event) => {
    if (showContextMenuFlag.value) {
        store.dispatch('ui/contextMenu/batches/hideContextMenu');
    }
};

// Монтирование и размонтирование обработчика событий
onMounted(() => {
    document.addEventListener('click', handleOutsideClick);
});

onBeforeUnmount(() => {
    document.removeEventListener('click', handleOutsideClick);
});

// Методы для действий в контекстном меню
const openBatchDialog = () => {
    showCreateImageDialog.value = true;
    store.dispatch('ui/contextMenu/batches/hideContextMenu');
};

const closeDialog = () => {
    showCreateImageDialog.value = false;
    imageName.value = '';
    selectedArtists.value = [];
    selectedArtDirectors.value = [];
    selectedModellers.value = [];
    selectedFreelancers.value = [];
};

const createImage = async () => {
    const allUsers = [
        ...selectedModellers.value,
        ...selectedFreelancers.value,
        ...selectedArtists.value,
        ...selectedArtDirectors.value
    ]
    if (imageName.value.trim()) {
        try {
            await store.dispatch('projects/createImage', {
                projectId: selectedProjectId.value,
                batchId: selectedBatchId.value,
                imageData: {
                    name: imageName.value.trim(),
                    users: allUsers.map(user => typeof user === 'object' ? user.id : user)
                }
            });
            closeDialog();
        } catch (error) {
            console.error('Ошибка при создании изображения:', error);
        }
    }
};

const confirmDeleteBatch = () => {
    store.dispatch('ui/contextMenu/batches/hideContextMenu');

    confirm.require({
        message: 'Are you sure you want to delete this batch?',
        header: 'Confirming deletion',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Yes, delete it',
        rejectLabel: 'Cancel',
        acceptClass: 'p-button-danger',
        accept: () => {
            store.dispatch('projects/deleteBatch', {
                projectId: selectedProjectId.value,
                batchId: selectedBatchId.value
            });
        }
    });
};
const reloadBatch = async () => {
    try {
        // Получаем даты текущих трех месяцев из календарного модуля
        const allDates = store.getters['calendar/allDatesInThreeMonths']
        if (allDates && allDates.length > 0) {
            const startDate = allDates[0]
            const endDate = allDates[allDates.length - 1]

            await store.dispatch('coloredCells/loadBatchColoredCellsByDateRange', {
                projectId: selectedProjectId.value,
                batchId: selectedBatchId.value,
                startDate: startDate,
                endDate: endDate
            })

            // Синхронизируем скролл после загрузки ячеек
            await nextTick()
            syncCalendarScrollAfterCellsLoad()
        }
    } catch (error) {
        console.error('Ошибка загрузки закрашенных ячеек для батча:', error)
    }
}
onMounted(() => {
})
</script>

<style scoped>
.context-menu {
    position: fixed;
    background-color: #ffffff;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    min-width: 180px;
    z-index: 1000;
    overflow: hidden;
}

.context-menu-header {
    padding: 8px 12px;
    background-color: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
    font-weight: 500;
    font-size: 14px;
    color: #495057;
}

.context-menu-items {
    padding: 4px 0;
}

.context-menu-item {
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: background-color 0.2s;
}

.context-menu-item:hover {
    background-color: #f1f3f5;
}

.context-menu-item i {
    font-size: 16px;
    color: #6c757d;
}

/* Дополнительные стили для PrimeVue */
:deep(.p-dialog-header) {
    border-bottom: 1px solid #e9ecef;
}

:deep(.p-dialog-footer) {
    border-top: 1px solid #e9ecef;
    padding-top: 1rem;
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
}

.p-field {
    margin-bottom: 1.5rem;
}

.p-field label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
}

.w-full {
    width: 100%;
}
</style>
