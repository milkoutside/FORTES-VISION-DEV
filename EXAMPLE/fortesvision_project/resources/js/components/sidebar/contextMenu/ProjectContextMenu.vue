<template>
    <div>
        <div
            v-if="showContextMenuFlag"
            class="context-menu"
            :style="{ top: contextMenuPosition.y + 'px', left: contextMenuPosition.x + 'px' }"
            @click.stop
        >
            <div class="context-menu-header">Project actions</div>
            <div class="context-menu-items">
                <div class="context-menu-item" @click.stop="openProjectInfoModal">
                    <i class="pi pi-info-circle"></i>
                    <span>Project information</span>
                </div>
                <div class="context-menu-item" @click.stop="openBatchDialog">
                    <i class="pi pi-plus"></i>
                    <span>Create batch</span>
                </div>
                <div class="context-menu-item">
                   <div @click.stop="completeProject" v-if="projectIsOpen">
                       <i class="pi pi-check"></i>
                       <span class="mx-1">Complete the project</span>
                   </div>
                    <div @click.stop="reopenProject" v-else>
                        <span>Reopen project</span>
                    </div>
                </div>
                <div class="context-menu-item" @click.stop="confirmDeleteProject">
                    <i class="pi pi-trash"></i>
                    <span>Delete project</span>
                </div>
            </div>
        </div>

        <!-- Модальное окно PrimeVue для создания батча -->
        <Dialog
            v-model:visible="showCreateBatchDialog"
            modal
            header="Create a new batch"
            :style="{ width: '450px' }"
            :closable="true"
            :dismissableMask="true"
        >
            <div class="p-field">
                <label for="batchName" class="p-d-block">Batch name</label>
                <InputText
                    id="batchName"
                    v-model="batchName"
                    type="text"
                    class="p-d-block w-full"
                    placeholder="Enter the name of the batch"
                    autofocus
                />
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
                    @click="createBatch"
                    :disabled="!batchName.trim()"
                />
            </template>
        </Dialog>

        <!-- ConfirmDialog для подтверждения удаления -->
        <Toast />
    </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useStore } from 'vuex';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import ConfirmDialog from 'primevue/confirmdialog';
import Toast from 'primevue/toast';

const store = useStore();
const confirm = useConfirm();
const toast = useToast();

// Получаем состояние контекстного меню из хранилища
const showContextMenuFlag = computed(() => store.getters['ui/contextMenu/projects/showContextMenu']);
const contextMenuPosition = computed(() => store.getters['ui/contextMenu/projects/contextMenuPosition']);
const selectedProjectId = computed(() => store.getters['ui/contextMenu/projects/selectedProjectId']);

// Локальное состояние для модального окна
const showCreateBatchDialog = ref(false);
const batchName = ref('');

// Флаг для предотвращения немедленного закрытия модального окна
const isMenuActionExecuting = ref(false);

// Обработчик для закрытия меню при клике вне его
const handleOutsideClick = (event) => {
    // Не закрываем меню, если выполняется действие
    if (isMenuActionExecuting.value) {
        return;
    }

    if (showContextMenuFlag.value) {
        store.dispatch('ui/contextMenu/projects/hideContextMenu');
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
const openBatchDialog = async () => {
    isMenuActionExecuting.value = true;

    // Сначала скрываем контекстное меню
    await store.dispatch('ui/contextMenu/projects/hideContextMenu');

    // Ждем следующий тик, чтобы DOM обновился
    await nextTick();

    // Показываем диалог создания батча
    showCreateBatchDialog.value = true;

    // Сбрасываем флаг через небольшую задержку
    setTimeout(() => {
        isMenuActionExecuting.value = false;
    }, 100);
};
const completeProject = async () => {
    isMenuActionExecuting.value = true;

    try {
        // Скрываем контекстное меню
        await store.dispatch('ui/contextMenu/projects/hideContextMenu');

        // Обновляем проект
        const result = await store.dispatch('projects/updateProject', {
            projectId: selectedProjectId.value,
            projectData: { isActive: false }
        });

        // Показываем уведомление об успехе
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Project completed',
            life: 3000
        });

    } catch (error) {
        console.error('Ошибка при завершении проекта:', error);

        // Показываем уведомление об ошибке
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Unable to complete the project',
            life: 5000
        });
    }

    // Сбрасываем флаг через небольшую задержку
    setTimeout(() => {
        isMenuActionExecuting.value = false;
    }, 100);
};
const reopenProject = async () => {
    console.log('Reopening project:', selectedProjectId.value);
    isMenuActionExecuting.value = true;

    try {
        // Скрываем контекстное меню
        await store.dispatch('ui/contextMenu/projects/hideContextMenu');

        // Обновляем проект
        const result = await store.dispatch('projects/updateProject', {
            projectId: selectedProjectId.value,
            projectData: { isActive: true }
        });

        // Показываем уведомление об успехе
        toast.add({
            severity: 'success',
            summary: 'Успешно',
            detail: 'Проект возобновлен',
            life: 3000
        });

        console.log('Project reopened successfully:', result);
    } catch (error) {
        console.error('Ошибка при возобновлении проекта:', error);

        // Показываем уведомление об ошибке
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Unable to resume the project',
            life: 5000
        });
    }

    setTimeout(() => {
        isMenuActionExecuting.value = false;
    }, 100);
};
const projectIsOpen = computed(() => {
    const project = store.getters['projects/getProjectById'](selectedProjectId.value)
    return project?.isActive ?? false
});
const openProjectInfoModal = async () => {
    console.log('Opening project info modal for project:', selectedProjectId.value);

    isMenuActionExecuting.value = true;

    // Сначала скрываем контекстное меню
    await store.dispatch('ui/contextMenu/projects/hideContextMenu');

    // Ждем следующий тик, чтобы DOM обновился
    await nextTick();

    // Показываем модальное окно информации о проекте
    await store.dispatch('ui/projectInfoModal/showModal', selectedProjectId.value);

    // Сбрасываем флаг через небольшую задержку
    setTimeout(() => {
        isMenuActionExecuting.value = false;
    }, 100);
};

const closeDialog = () => {
    showCreateBatchDialog.value = false;
    batchName.value = '';
};

const createBatch = async () => {
    console.log('Creating batch for project:', selectedProjectId.value);
    if (batchName.value.trim()) {
        try {
            await store.dispatch('projects/createBatch', {
                projectId: selectedProjectId.value,
                batchData: {
                    name: batchName.value.trim()
                }
            });
            closeDialog();
        } catch (error) {
            console.error('Ошибка при создании батча:', error);
            // Можно добавить уведомление об ошибке
        }
    }
};

const confirmDeleteProject = async () => {
    isMenuActionExecuting.value = true;

    await store.dispatch('ui/contextMenu/projects//hideContextMenu');

    await nextTick();

    confirm.require({
        message: 'Are you sure you want to delete this project?',
        header: 'Confirming deletion',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Yes, delete it',
        rejectLabel: 'Cancel',
        acceptClass: 'p-button-danger',
        accept: () => {
            store.dispatch('projects/deleteProject', selectedProjectId.value);
        },
        reject: () => {
            // Сбрасываем флаг и при отказе
            setTimeout(() => {
                isMenuActionExecuting.value = false;
            }, 100);
        }
    });

    // Сбрасываем флаг через небольшую задержку
    setTimeout(() => {
        isMenuActionExecuting.value = false;
    }, 100);
};

onMounted(() => {
    console.log("Context menu mounted, selectedProjectId:", selectedProjectId.value);
});
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
    user-select: none;
}

.context-menu-item:hover {
    background-color: #f1f3f5;
}

.context-menu-item i {
    font-size: 16px;
    color: #6c757d;
    width: 16px;
    text-align: center;
}

.context-menu-item:hover i {
    color: #495057;
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
