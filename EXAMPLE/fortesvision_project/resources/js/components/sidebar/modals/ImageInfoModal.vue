<template>
    <div>
        <Dialog
            :visible="showModal"
            modal
            header="Редактировать изображение"
            :style="{ width: '650px' }"
            class="image-dialog"
            :closable="true"
            :dismissableMask="false"
            @update:visible="handleVisibilityChange"
        >
            <div class="image-form" v-if="currentImage">
                <div class="p-fluid">
                    <div class="field mb-4">
                        <label for="imageName" class="block text-900 font-medium mb-2">
                            Image name <span class="text-red-500">*</span>
                        </label>
                        <InputText
                            id="imageName"
                            v-model="editImage.name"
                            placeholder="Enter image name"
                            :class="{ 'p-invalid': errors.name }"
                            :disabled="isUpdating"
                        />
                        <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
                    </div>

                    <div class="field mb-4">
                        <label for="artists" class="block text-900 font-medium mb-2">Artists</label>
                        <UserMultiSelect
                            v-model="editImage.artists"
                            role="artist"
                            :disabled="isUpdating"
                        />
                    </div>

                    <div class="field mb-4">
                        <label for="art_directors" class="block text-900 font-medium mb-2">Art Directors</label>
                        <UserMultiSelect
                            v-model="editImage.artDirectors"
                            role="art_director"
                            :disabled="isUpdating"
                        />
                    </div>

                    <div class="field mb-4">
                        <label for="freelancers" class="block text-900 font-medium mb-2">Freelancers</label>
                        <UserMultiSelect
                            v-model="editImage.freelancers"
                            role="freelancer"
                            :disabled="isUpdating"
                        />
                    </div>

                    <div class="field mb-4">
                        <label for="modellers" class="block text-900 font-medium mb-2">Modellers</label>
                        <UserMultiSelect
                            v-model="editImage.modellers"
                            role="modeller"
                            :disabled="isUpdating"
                        />
                    </div>
                </div>
            </div>
            <template #footer>
                <div class="flex justify-content-end gap-2">
                    <Button
                        class="mx-3"
                        label="Close"
                        severity="secondary"
                        @click="closeEditImageModal"
                        :disabled="isUpdating"
                        outlined
                    />
                    <Button
                        label="Update"
                        severity="success"
                        @click="updateImage"
                        :loading="isUpdating"
                    />
                </div>
            </template>
        </Dialog>
        <!-- Toast для уведомлений -->
        <Toast />
    </div>
</template>

<script setup>
import { ref, computed, reactive, watch, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Toast from 'primevue/toast'
import UserMultiSelect from "@/components/ui/selects/UserMultiSelect.vue"

const store = useStore()
const toast = useToast()

const isUpdating = ref(false)

// Получаем данные из store
const showModal = computed(() => store.getters['ui/imageInfoModal/showModal'])
const projectId = computed(() => store.state.ui.imageInfoModal.projectId)
const batchId = computed(() => store.state.ui.imageInfoModal.batchId)
const imageId = computed(() => store.state.ui.imageInfoModal.imageId)

const currentImage = computed(() => {
    if (!projectId.value || !batchId.value || !imageId.value) return null

    const project = store.getters['projects/getProjectById'](projectId.value)
    if (!project) return null

    const batch = project.batches?.find(b => b.id === batchId.value)
    if (!batch) return null

    return batch.images?.find(i => i.id === imageId.value)
})

// Данные для редактирования изображения
const editImage = reactive({
    name: '',
    artists: [],
    artDirectors: [],
    freelancers: [],
    modellers: []
})

// Ошибки валидации
const errors = reactive({
    name: ''
})

// Функция для разделения пользователей по ролям
const separateUsersByRole = (users) => {
    const separated = {
        artists: [],
        artDirectors: [],
        freelancers: [],
        modellers: []
    }

    if (!users || !Array.isArray(users)) return separated

    users.forEach(user => {
        switch (user.role) {
            case 'artist':
                separated.artists.push(user)
                break
            case 'art_director':
                separated.artDirectors.push(user)
                break
            case 'freelancer':
                separated.freelancers.push(user)
                break
            case 'modeller':
                separated.modellers.push(user)
                break
        }
    })

    return separated
}

// Следим за изменениями изображения и заполняем форму
watch(currentImage, (image) => {
    if (image) {
        nextTick(() => {
            editImage.name = image.name || ''

            const separatedUsers = separateUsersByRole(image.users)
            editImage.artists = separatedUsers.artists
            editImage.artDirectors = separatedUsers.artDirectors
            editImage.freelancers = separatedUsers.freelancers
            editImage.modellers = separatedUsers.modellers
        })
    }
}, { immediate: true })

const handleVisibilityChange = (visible) => {
    if (!visible) {
        closeEditImageModal()
    }
}

const closeEditImageModal = () => {
    store.commit('ui/imageInfoModal/HIDE_MODAL')
    resetForm()
}

const resetForm = () => {
    editImage.name = ''
    editImage.artists = []
    editImage.artDirectors = []
    editImage.freelancers = []
    editImage.modellers = []
    clearErrors()
}

const clearErrors = () => {
    Object.keys(errors).forEach(key => {
        errors[key] = ''
    })
}

const validateForm = () => {
    let isValid = true
    clearErrors()

    if (!editImage.name.trim()) {
        errors.name = 'Image name is required'
        isValid = false
    }

    return isValid
}

const updateImage = async () => {
    if (!validateForm()) {
        return
    }

    isUpdating.value = true

    try {
        // Объединяем всех пользователей с их ролями
        const allUsers = [
            ...editImage.artists.map(user => ({ id: typeof user === 'object' ? user.id : user, role: 'artist' })),
            ...editImage.artDirectors.map(user => ({ id: typeof user === 'object' ? user.id : user, role: 'art_director' })),
            ...editImage.freelancers.map(user => ({ id: typeof user === 'object' ? user.id : user, role: 'freelancer' })),
            ...editImage.modellers.map(user => ({ id: typeof user === 'object' ? user.id : user, role: 'modeller' }))
        ]

        const imageData = {
            name: editImage.name.trim(),
            users: allUsers.map(user => user.id)
        }
        console.log("image data", imageData)
        const result = await store.dispatch('projects/updateImage',
            {
                projectId: projectId.value,
                batchId: batchId.value,
                imageId: imageId.value,
                imageData: imageData
            }
        )

        toast.add({
            severity: 'success',
            summary: 'Successfully',
            detail: 'Image successfully updated',
            life: 3000
        })
        closeEditImageModal()
    } catch (error) {
        console.error('Ошибка обновления изображения:', error)
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'An unexpected error has occurred',
            life: 5000
        })
    } finally {
        isUpdating.value = false
    }
}
</script>

<style scoped>
.image-dialog {
    --dialog-content-padding: 1.5rem;
}

.image-dialog :deep(.p-dialog) {
    overflow: visible;
}

.image-dialog :deep(.p-dialog-content) {
    padding: var(--dialog-content-padding) !important;
    overflow: visible;
    min-height: 500px;
}

.image-dialog :deep(.p-dialog-header) {
    padding: 1.5rem 1.5rem 1rem 1.5rem;
}

.image-dialog :deep(.p-dialog-footer) {
    padding: 1rem 1.5rem 1.5rem 1.5rem;
}

.image-form {
    width: 100%;
    position: relative;
}

.image-form .field {
    margin-bottom: 1.5rem;
    position: relative;
}

.image-form .field:last-child {
    margin-bottom: 0;
}

.p-error {
    color: #e24c4c;
    font-size: 0.875rem;
    margin-top: 0.25rem;
    display: block;
}

.image-form :deep(.p-inputtext) {
    width: 100%;
    box-sizing: border-box;
}

/* Предотвращаем коллапс контента */
.image-form :deep(*) {
    pointer-events: auto;
}

.image-dialog :deep(.p-dialog-mask) {
    pointer-events: auto;
}

/* Обеспечиваем правильную работу с модальным окном */
.image-dialog :deep(.p-component-overlay) {
    pointer-events: auto;
}

/* Стили для мультиселектов */
.image-form :deep(.p-multiselect) {
    width: 100%;
}
</style>
