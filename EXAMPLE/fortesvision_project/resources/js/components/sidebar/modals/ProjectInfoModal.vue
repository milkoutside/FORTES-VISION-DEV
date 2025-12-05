<template>
    <div>
        <Dialog
            :visible="showModal"
            modal
            header="Редактировать проект"
            :style="{ width: '650px' }"
            :dismissableMask="false"
            :closable="!isUpdating"
            class="project-dialog"
            @update:visible="handleVisibilityChange"
        >
            <div class="project-form p-4" v-if="currentProject">
                <div class="p-fluid">
                    <div class="field mb-4">
                        <label for="projectName" class="block text-900 font-medium mb-2">
                            Project name <span class="text-red-500">*</span>
                        </label>
                        <InputText
                            id="projectName"
                            v-model="editProject.name"
                            placeholder="Enter a project name"
                            :class="{ 'p-invalid': errors.name }"
                            :disabled="isUpdating"
                        />
                        <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
                    </div>
                    <div class="field mb-4">
                        <label for="clientName" class="block text-900 font-medium mb-2">
                            Client Name <span class="text-red-500">*</span>
                        </label>
                        <InputText
                            id="clientName"
                            v-model="editProject.clientName"
                            placeholder="Enter the client's name"
                            :class="{ 'p-invalid': errors.clientName }"
                            :disabled="isUpdating"
                        />
                        <small v-if="errors.clientName" class="p-error">{{ errors.clientName }}</small>
                    </div>
                    <div class="formgrid grid">
                        <div class="field col-6 mb-4">
                            <label for="startDate" class="block text-900 font-medium mb-2">
                                Project start date <span class="text-red-500">*</span>
                            </label>
                            <DatePicker
                                id="startDate"
                                v-model="editProject.startDate"
                                dateFormat="dd.mm.yy"
                                placeholder="Select start date"
                                :class="{ 'p-invalid': errors.startDate }"
                                :disabled="isUpdating"
                                showIcon
                            />
                            <small v-if="errors.startDate" class="p-error">{{ errors.startDate }}</small>
                        </div>
                        <div class="field col-6 mb-4">
                            <label for="endDate" class="block text-900 font-medium mb-2">
                                Project end date <span class="text-red-500">*</span>
                            </label>
                            <DatePicker
                                id="endDate"
                                v-model="editProject.endDate"
                                dateFormat="dd.mm.yy"
                                placeholder="Select end date"
                                :class="{ 'p-invalid': errors.endDate }"
                                :disabled="isUpdating"
                                showIcon
                            />
                            <small v-if="errors.endDate" class="p-error">{{ errors.endDate }}</small>
                        </div>
                    </div>
                    <div class="field mb-4">
                        <label for="clientName" class="block text-900 font-medium mb-2">
                            Project Managers<span class="text-red-500"></span>
                        </label>
                        <UserMultiSelect v-model="selectedProjectManagers" role="project_manager" />
                    </div>
                    <div class="field mb-4">
                        <label class="block text-900 font-medium mb-3">Deadline type</label>
                        <div class="flex flex-wrap gap-3">
                            <div class="flex align-items-center">
                                <RadioButton
                                    id="hard"
                                    v-model="editProject.deadlineType"
                                    value="hard"
                                    :disabled="isUpdating"
                                />
                                <label for="hard" class="mx-2 ml-2 text-900">Hard</label>
                            </div>
                            <div class="flex align-items-center mt-3">
                                <RadioButton
                                    id="soft"
                                    v-model="editProject.deadlineType"
                                    value="soft"
                                    :disabled="isUpdating"
                                />
                                <label for="soft" class="mx-2 ml-2 text-900">Soft</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <template #footer>
                <div class="flex justify-content-end gap-2">
                    <Button
                        class="mx-3"
                        label="Close"
                        severity="secondary"
                        @click="closeEditProjectModal"
                        :disabled="isUpdating"
                        outlined
                    />
                    <Button
                        label="Update"
                        severity="success"
                        @click="updateProject"
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
import { ref, computed, reactive, watch } from 'vue'
import { useStore } from 'vuex'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import DatePicker from 'primevue/datepicker'
import RadioButton from 'primevue/radiobutton'
import Toast from 'primevue/toast'
import UserMultiSelect from "@/components/ui/selects/UserMultiSelect.vue";

const store = useStore()
const toast = useToast()

const isUpdating = ref(false)
const selectedProjectManagers = ref([])

// Получаем данные из store
const showModal = computed(() => store.getters['ui/projectInfoModal/showModal'])
const projectId = computed(() => store.state.ui.projectInfoModal.projectId)
const currentProject = computed(() => {
    if (!projectId.value) return null
    return store.getters['projects/getProjectById'](projectId.value)
})

// Данные для редактирования проекта
const editProject = reactive({
    name: '',
    clientName: '',
    startDate: null,
    endDate: null,
    deadlineType: 'soft'
})

// Ошибки валидации
const errors = reactive({
    name: '',
    clientName: '',
    startDate: '',
    endDate: ''
})

// Следим за изменениями проекта и заполняем форму
watch(currentProject, (project) => {
    if (project) {
        editProject.name = project.name || ''
        editProject.clientName = project.clientName || ''
        editProject.startDate = project.startDate ? new Date(project.startDate) : null
        editProject.endDate = project.endDate ? new Date(project.endDate) : null
        editProject.deadlineType = project.deadlineType || 'soft'
        selectedProjectManagers.value = project.users || []
    }
}, { immediate: true })

const handleVisibilityChange = (visible) => {
    if (!visible) {
        closeEditProjectModal()
    }
}

const closeEditProjectModal = () => {
    store.commit('ui/projectInfoModal/HIDE_MODAL')
    resetForm()
}

const resetForm = () => {
    editProject.name = ''
    editProject.clientName = ''
    editProject.startDate = null
    editProject.endDate = null
    editProject.deadlineType = 'soft'
    selectedProjectManagers.value = []
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

    if (!editProject.name.trim()) {
        errors.name = 'Project name is required'
        isValid = false
    }

    if (!editProject.clientName.trim()) {
        errors.clientName = 'Customer name is required'
        isValid = false
    }

    if (!editProject.startDate) {
        errors.startDate = 'Start date is mandatory'
        isValid = false
    }

    if (!editProject.endDate) {
        errors.endDate = 'End date is mandatory'
        isValid = false
    }

    if (editProject.startDate && editProject.endDate && editProject.startDate >= editProject.endDate) {
        errors.endDate = 'The end date must be later than the start date.'
        isValid = false
    }

    return isValid
}

const formatDateForServer = (date) => {
    if (!date) return null
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

const updateProject = async () => {
    if (!validateForm()) {
        return
    }

    isUpdating.value = true

    try {
        const projectData = {
            id: projectId.value,
            name: editProject.name.trim(),
            clientName: editProject.clientName.trim(),
            startDate: formatDateForServer(editProject.startDate),
            endDate: formatDateForServer(editProject.endDate),
            deadlineType: editProject.deadlineType,
            users: selectedProjectManagers.value.map(user => typeof user === 'object' ? user.id : user)
        }

        const result = await store.dispatch('projects/updateProject', {projectId : projectId.value, projectData:projectData})

        toast.add({
            severity: 'success',
            summary: 'Successfully',
            detail: 'Project successfully updated',
            life: 3000
        })
        closeEditProjectModal()
    } catch (error) {
        console.error('Project update error:', error)
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
.project-dialog :deep(.p-dialog-content) {
    padding: 0 !important;
}

.project-form {
    min-height: 400px;
}

.project-form .field {
    margin-bottom: 1rem;
}

.p-error {
    color: red;
    font-size: 0.875rem;
    margin-top: 0.25rem;
    display: block;
}

.project-form :deep(.p-inputtext),
.project-form :deep(.p-datepicker-input) {
    width: 100%;
}

.project-form :deep(.p-datepicker) {
    width: 100%;
}

.formgrid.grid {
    margin: 0 -0.5rem;
}

.formgrid .col-6 {
    padding: 0 0.5rem;
}
</style>
