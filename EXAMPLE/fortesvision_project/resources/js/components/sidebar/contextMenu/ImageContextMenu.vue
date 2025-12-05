<template>
    <div>
        <div
            v-if="showContextMenuFlag"
            class="context-menu"
            :style="{ top: contextMenuPosition.y + 'px', left: contextMenuPosition.x + 'px' }"
            @click.stop
        >
            <div class="context-menu-header">Image actions</div>
            <div class="context-menu-items">
                <div class="context-menu-item" @click="openImageDialog">
                    <i class="pi pi-info-circle"></i>
                    <span>Image information</span>
                </div>
                <div class="context-menu-item" @click="confirmDeleteImage">
                    <i class="pi pi-trash"></i>
                    <span>Delete image</span>
                </div>
            </div>
        </div>

        <!-- ConfirmDialog для подтверждения удаления -->

    </div>
</template>

<script setup>
import {computed, ref, onMounted, onBeforeUnmount, nextTick} from 'vue';
import { useStore } from 'vuex';
import { useConfirm } from 'primevue/useconfirm';
const store = useStore();
const confirm = useConfirm();
const isMenuActionExecuting = ref(false);
// Получаем состояние контекстного меню из хранилища
const showContextMenuFlag = computed(() => store.getters['sidebar/sidebarImageContextMenu/showContextMenu']);
const contextMenuPosition = computed(() => store.getters['sidebar/sidebarImageContextMenu/contextMenuPosition']);
const selectedProjectId = computed(() => store.getters['sidebar/sidebarImageContextMenu/selectedProjectId']);
const selectedBatchId = computed(() => store.getters['sidebar/sidebarImageContextMenu/selectedBatchId']);
const selectedImageId = computed(() => store.getters['sidebar/sidebarImageContextMenu/selectedImageId']);

// Обработчик для закрытия меню при клике вне его
const handleOutsideClick = (event) => {
    if (showContextMenuFlag.value) {
        store.dispatch('sidebar/sidebarImageContextMenu/hideContextMenu');
    }
};

// Монтирование и размонтирование обработчика событий
onMounted(() => {
    document.addEventListener('click', handleOutsideClick);
});

onBeforeUnmount(() => {
    document.removeEventListener('click', handleOutsideClick);
});

const openImageDialog = async () => {
    console.log('Opening image info modal for image:', selectedImageId.value);

    isMenuActionExecuting.value = true;

    // Сначала скрываем контекстное меню
    await store.dispatch('sidebar/sidebarImageContextMenu/hideContextMenu');

    // Ждем следующий тик, чтобы DOM обновился
    await nextTick();

    // Показываем модальное окно информации об изображении
    await store.dispatch('ui/imageInfoModal/showModal', {
        projectId: selectedProjectId.value,
        batchId: selectedBatchId.value,
        imageId: selectedImageId.value
    });

    // Сбрасываем флаг через небольшую задержку
    setTimeout(() => {
        isMenuActionExecuting.value = false;
    }, 100);
};

const confirmDeleteImage = () => {
    store.dispatch('sidebar/sidebarImageContextMenu/hideContextMenu');

    confirm.require({
        message: 'Are you sure you want to delete this image?',
        header: 'Confirming deletion',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Yes, delete it',
        rejectLabel: 'Cancel',
        acceptClass: 'p-button-danger',
        accept: () => {
            store.dispatch('projects/deleteImage', {
                projectId: selectedProjectId.value,
                batchId: selectedBatchId.value,
                imageId: selectedImageId.value
            });
        }
    });
};
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
