<template>
    <div>

        <Button
            label="Create Project"
            size="small"
            severity="success"
            @click="showCreateProjectModal"
        />

        <!-- Модальное окно создания проекта -->
        <Dialog
            v-model:visible="createProjectModal"
            modal
            header="Create new project"
            :style="{ width: '650px' }"
            :dismissableMask="true"
            :closable="!isCreating"
            class="project-dialog"
        >
            <div class="project-form p-4">
                <div class="p-fluid">
                    <div class="field mb-4">
                        <label for="projectName" class="block text-900 font-medium mb-2">
                            Project name <span class="text-red-500">*</span>
                        </label>
                        <InputText
                            id="projectName"
                            v-model="newProject.name"
                            placeholder="Enter a project name"
                            :class="{ 'p-invalid': errors.name }"
                            :disabled="isCreating"
                        />
                        <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
                    </div>

                    <div class="field mb-4">
                        <label for="clientName" class="block text-900 font-medium mb-2">
                            Client Name <span class="text-red-500">*</span>
                        </label>
                        <InputText
                            id="clientName"
                            v-model="newProject.clientName"
                            placeholder="Enter the client's name"
                            :class="{ 'p-invalid': errors.clientName }"
                            :disabled="isCreating"
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
                                v-model="newProject.startDate"
                                dateFormat="dd.mm.yy"
                                placeholder="Select start date"
                                :class="{ 'p-invalid': errors.startDate }"
                                :disabled="isCreating"
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
                                v-model="newProject.endDate"
                                dateFormat="dd.mm.yy"
                                placeholder="Select end date"
                                :class="{ 'p-invalid': errors.endDate }"
                                :disabled="isCreating"
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
                            <div class="flex align-items-center mb-2">
                                <RadioButton
                                    id="hard"
                                    v-model="newProject.deadlineType"
                                    value="hard"
                                    :disabled="isCreating"
                                />
                                <label for="hard" class="mx-2 ml-2 text-900">Hard</label>
                            </div>
                            <div class="flex align-items-center">
                                <RadioButton
                                    id="soft"
                                    v-model="newProject.deadlineType"
                                    value="soft"
                                    :disabled="isCreating"
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
                        @click="closeCreateProjectModal"
                        :disabled="isCreating"
                        outlined
                    />
                    <Button
                        label="Create"
                        severity="success"
                        @click="createProject"
                        :loading="isCreating"
                    />
                </div>
            </template>
        </Dialog>

        <!-- Toast для уведомлений -->
        <Toast />

    </div>

</template>

<script setup>
import {ref, watch, reactive} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import {useToast} from 'primevue/usetoast'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import DatePicker from 'primevue/datepicker'
import RadioButton from 'primevue/radiobutton'
import Toast from 'primevue/toast'
import UserMultiSelect from "@/components/ui/selects/UserMultiSelect.vue"
import storage from "@/storage/storage.js"

const router = useRouter()
const route = useRoute()
const toast = useToast()

const tabs = [
    {label: 'Проекти', route: '/projects'}
]

const activeIndex = ref(0)
const createProjectModal = ref(false)
const isCreating = ref(false);
const selectedProjectManagers = ref([]);

// Данные нового проекта
const newProject = reactive({
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



const onTabChange = (e) => {
    activeIndex.value = e.index
    router.push(tabs[e.index].route)
}

const showCreateProjectModal = () => {
    createProjectModal.value = true
    resetForm()
}

const closeCreateProjectModal = () => {
    createProjectModal.value = false
    resetForm()
}

const resetForm = () => {
    newProject.name = ''
    newProject.clientName = ''
    newProject.startDate = null
    newProject.endDate = null
    newProject.deadlineType = 'soft'
    selectedProjectManagers.value = []

    // Очищаем ошибки
    Object.keys(errors).forEach(key => {
        errors[key] = ''
    })
}

const validateForm = () => {
    let isValid = true

    // Очищаем предыдущие ошибки
    Object.keys(errors).forEach(key => {
        errors[key] = ''
    })

    if (!newProject.name.trim()) {
        errors.name = 'Project name is required'
        isValid = false
    }

    if (!newProject.clientName.trim()) {
        errors.clientName = 'Customer name is required'
        isValid = false
    }

    if (!newProject.startDate) {
        errors.startDate = 'Start date is mandatory'
        isValid = false
    }

    if (!newProject.endDate) {
        errors.endDate = 'End date is mandatory'
        isValid = false
    }

    if (newProject.startDate && newProject.endDate && newProject.startDate >= newProject.endDate) {
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

const createProject = async () => {
    if (!validateForm()) {
        return
    }

    console.log('Выбранные менеджеры проекта:', selectedProjectManagers.value);

    isCreating.value = true

    try {
        const projectData = {
            name: newProject.name.trim(),
            clientName: newProject.clientName.trim(),
            startDate: formatDateForServer(newProject.startDate),
            endDate: formatDateForServer(newProject.endDate),
            deadlineType: newProject.deadlineType,
            isActive: true,
            nextBatchId: 1
        }

        const result = await storage.dispatch('projects/createProject', projectData)

        if (result) {
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'The project was successfully created.',
                life: 3000
            })

            // Если есть выбранные менеджеры проекта, привязываем их к проекту
            if (selectedProjectManagers.value && selectedProjectManagers.value.length > 0) {
                try {
                    // Извлекаем ID пользователей из объектов
                    const userIds = selectedProjectManagers.value.map(user =>
                        typeof user === 'object' ? user.id : user
                    );

                    console.log('Привязка пользователей к проекту:', {
                        projectId: result.id,
                        userIds: userIds,
                        role: 'project_manager'
                    });

                    await storage.dispatch('projects/attachUsersToProject', {
                        projectId: result.id,
                        userIds: userIds,
                        role: 'project_manager'
                    })

                    toast.add({
                        severity: 'info',
                        summary: 'Info',
                        detail: `${selectedProjectManagers.value.length} managers are assigned to the project.`,
                        life: 3000
                    })
                } catch (error) {
                    console.error('Ошибка привязки пользователей:', error)
                    toast.add({
                        severity: 'warn',
                        summary: 'Warning',
                        detail: 'The project was created, but it was not possible to assign managers to it.',
                        life: 5000
                    })
                }
            }
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to create project',
                life: 5000
            })
        }
    } catch (error) {
        console.error('Ошибка создания проекта:', error)
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'An unexpected error has occurred',
            life: 5000
        })
    } finally {
        isCreating.value = false
        closeCreateProjectModal()
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
