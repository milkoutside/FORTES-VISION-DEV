import axios from 'axios'

const state = {
    projects: [],
    selectedProject: null,
    expandedProjects: new Set(), // ID развернутых проектов
    expandedBatches: new Map() // Map для отслеживания развернутых батчей: projectId -> Set of batchIds
}

const getters = {
    allProjects: (state) => state.projects,
    selectedProject: (state) => state.selectedProject,

    // Получить активные проекты
    activeProjects: (state) => state.projects.filter(project => project.isActive),

    // Получить проект по ID
    getProjectById: (state) => (id) => state.projects.find(project => project.id === id),

    // Получить батчи проекта
    getProjectBatches: (state) => (projectId) => {
        const project = state.projects.find(p => p.id === projectId)
        return project ? project.batches : []
    },

    // Получить изображения батча
    getBatchImages: (state) => (projectId, batchId) => {
        const project = state.projects.find(p => p.id === projectId)
        if (!project) return []

        const batch = project.batches.find(b => b.id === batchId)
        return batch ? batch.images : []
    },

    // Проверить, развернут ли проект
    isProjectExpanded: (state) => (projectId) => {
        return state.expandedProjects.has(projectId)
    },

    // Проверить, развернут ли батч
    isBatchExpanded: (state) => (projectId, batchId) => {
        const projectBatches = state.expandedBatches.get(projectId)
        return projectBatches ? projectBatches.has(batchId) : false
    }
}

const mutations = {
    SET_PROJECTS(state, projects) {
        // Нормализация: гарантируем массивы batches и images
        state.projects = (projects || []).map(project => ({
            ...project,
            batches: (project.batches || []).map(batch => ({
                ...batch,
                images: batch.images || []
            }))
        }))
    },

    SET_SELECTED_PROJECT(state, project) {
        state.selectedProject = project
    },

    ADD_PROJECT(state, project) {
        const normalized = {
            ...project,
            batches: (project?.batches || []).map(batch => ({
                ...batch,
                images: batch.images || []
            }))
        }
        const existingIndex = state.projects.findIndex(p => p.id === project.id)
        if (existingIndex !== -1) {
            // Если проект уже существует, обновляем его
            state.projects.splice(existingIndex, 1, normalized)
        } else {
            // Если проекта нет, добавляем новый
            state.projects.push(normalized)
        }
    },

    UPDATE_PROJECT(state, updatedProject) {
        const normalized = {
            ...updatedProject,
            batches: (updatedProject?.batches || []).map(batch => ({
                ...batch,
                images: batch.images || []
            }))
        }
        const index = state.projects.findIndex(p => p.id === updatedProject.id)
        if (index !== -1) {
            state.projects.splice(index, 1, normalized)
        }
    },

    DELETE_PROJECT(state, projectId) {
        state.projects = state.projects.filter(p => p.id !== projectId)
        if (state.selectedProject && state.selectedProject.id === projectId) {
            state.selectedProject = null
        }
        // Удаляем из развернутых проектов и батчей
        state.expandedProjects.delete(projectId)
        state.expandedBatches.delete(projectId)
    },

    

    // Мутации для разворачивания/сворачивания
    TOGGLE_PROJECT_EXPANSION(state, projectId) {
        if (state.expandedProjects.has(projectId)) {
            state.expandedProjects.delete(projectId)
            // Сворачиваем все батчи проекта
            state.expandedBatches.delete(projectId)
        } else {
            state.expandedProjects.add(projectId)
        }
    },

    TOGGLE_BATCH_EXPANSION(state, { projectId, batchId }) {
        if (!state.expandedBatches.has(projectId)) {
            state.expandedBatches.set(projectId, new Set())
        }

        const projectBatches = state.expandedBatches.get(projectId)
        if (projectBatches.has(batchId)) {
            projectBatches.delete(batchId)
        } else {
            projectBatches.add(batchId)
        }
    },

    // Мутации для батчей
    ADD_BATCH_TO_PROJECT(state, { projectId, batch }) {
        const project = state.projects.find(p => p.id === projectId)
        if (project) {
            project.batches.push(batch)
        }
    },

    UPDATE_BATCH_IN_PROJECT(state, { projectId, batchId, updatedBatch }) {
        const project = state.projects.find(p => p.id === projectId)
        if (project) {
            const batchIndex = project.batches.findIndex(b => b.id === batchId)
            if (batchIndex !== -1) {
                project.batches.splice(batchIndex, 1, updatedBatch)
            }
        }
    },

    DELETE_BATCH_FROM_PROJECT(state, { projectId, batchId }) {
        const project = state.projects.find(p => p.id === projectId)
        if (project) {
            project.batches = project.batches.filter(b => b.id !== batchId)
        }
        // Удаляем из развернутых батчей
        const projectBatches = state.expandedBatches.get(projectId)
        if (projectBatches) {
            projectBatches.delete(batchId)
        }
    },

    // Мутации для изображений
    ADD_IMAGE_TO_BATCH(state, { projectId, batchId, image }) {
        const project = state.projects.find(p => p.id === projectId)
        if (project) {
            const batch = project.batches.find(b => b.id === batchId)
            if (batch) {
                batch.images.push(image)
            }
        }
    },

    // Обновить батчи проекта
    UPDATE_PROJECT_BATCHES(state, { projectId, batches }) {
        const project = state.projects.find(p => p.id === projectId)
        if (project) {
            project.batches = batches
        }
    },

    // Обновить изображения батча
    UPDATE_BATCH_IMAGES(state, { projectId, batchId, images }) {
        const project = state.projects.find(p => p.id === projectId)
        if (project) {
            const batch = project.batches.find(b => b.id === batchId)
            if (batch) {
                batch.images = images
            }
        }
    },

    UPDATE_IMAGE_IN_BATCH(state, { projectId, batchId, imageId, updatedImage }) {
        const project = state.projects.find(p => p.id === projectId)
        if (project) {
            const batch = project.batches.find(b => b.id === batchId)
            if (batch) {
                const imageIndex = batch.images.findIndex(i => i.id === imageId)
                if (imageIndex !== -1) {
                    batch.images.splice(imageIndex, 1, updatedImage)
                }
            }
        }
    },

    DELETE_IMAGE_FROM_BATCH(state, { projectId, batchId, imageId }) {
        const project = state.projects.find(p => p.id === projectId)
        if (project) {
            const batch = project.batches.find(b => b.id === batchId)
            if (batch) {
                batch.images = batch.images.filter(i => i.id !== imageId)
            }
        }
    }
}

const actions = {
    // Загрузить все проекты
    async fetchAllProjects({ commit }) {
        const { data } = await axios.get('/api/projects')
        commit('SET_PROJECTS', data.data ?? data)
    },

    // Создать новый проект
    async createProject({ commit }, projectData) {
        const { data } = await axios.post('/api/projects', projectData)
        const payload = data.data ?? data
        commit('ADD_PROJECT', payload)
        return payload
    },

    // Действия для разворачивания/сворачивания
    toggleProjectExpansion({ commit }, projectId) {
        commit('TOGGLE_PROJECT_EXPANSION', projectId)
    },

    toggleBatchExpansion({ commit }, { projectId, batchId }) {
        commit('TOGGLE_BATCH_EXPANSION', { projectId, batchId })
    },

    // Выбрать проект
    selectProject({ commit, getters }, projectId) {
        const project = getters.getProjectById(projectId)
        commit('SET_SELECTED_PROJECT', project)
    },



    // Привязать пользователей к проекту
    async attachUsersToProject({ commit }, { projectId, userIds, role }) {
        const { data } = await axios.post(`/api/projects/${projectId}/attach-users`, {
            user_ids: userIds,
            role: role
        })
        const payload = data.data ?? data
        commit('UPDATE_PROJECT', payload)
        return payload
    },

    // Загрузить проекты по страницам
    async fetchProjectsByPage({ commit }, { page = 1, perPage = 10, search = '', userIds = [] }) {
        const params = {
            page: page,
            per_page: perPage,
            ...(search ? { search } : {}),
            ...(userIds && userIds.length ? { 'user_ids': userIds } : {})
        }
        const { data } = await axios.get('/api/projects', { params })
        const payload = data.data ?? data
        return {
            projects: payload,
            hasMore: Array.isArray(payload) ? payload.length === perPage : false
        }
    },

    // Загрузить батчи проекта
    async fetchProjectBatches({ commit }, projectId) {
        const { data } = await axios.get(`/api/projects/${projectId}/batches`)
        const payload = data.data ?? data
        commit('UPDATE_PROJECT_BATCHES', { projectId, batches: payload })
        return payload
    },

    // Загрузить изображения батча
    async fetchBatchImages({ commit }, { projectId, batchId }) {
        const { data } = await axios.get(`/api/batches/${batchId}/images`)
        const payload = data.data ?? data
        commit('UPDATE_BATCH_IMAGES', { projectId, batchId, images: payload })
        return payload
    },

    // Создать батч
    async createBatch({ commit }, { projectId, batchData }) {
        const { data } = await axios.post(`/api/projects/${projectId}/batches`, batchData)
        const payload = data.data ?? data
        commit('ADD_BATCH_TO_PROJECT', { projectId, batch: payload })
        return payload
    },

    // Создать изображение
    async createImage({ commit }, { projectId, batchId, imageData }) {
        const { data } = await axios.post(`/api/batches/${batchId}/images`, imageData)
        const payload = data.data ?? data
        commit('ADD_IMAGE_TO_BATCH', { projectId, batchId, image: payload })
        return payload
    },

    // Удалить проект
    async deleteProject({ commit }, projectId) {
        await axios.delete(`/api/projects/${projectId}`)
        commit('DELETE_PROJECT', projectId)
        return true
    },

    // Удалить батч
    async deleteBatch({ commit }, { projectId, batchId }) {
        await axios.delete(`/api/projects/${projectId}/batches/${batchId}`)
        commit('DELETE_BATCH_FROM_PROJECT', { projectId, batchId })
        return true
    },

    // Удалить изображение
    async deleteImage({ commit }, { projectId, batchId, imageId }) {
        await axios.delete(`/api/projects/${projectId}/batches/${batchId}/images/${imageId}`)
        commit('DELETE_IMAGE_FROM_BATCH', { projectId, batchId, imageId })
        return true
    },

    // Обновить проект
    async updateProject({ commit }, { projectId, projectData }) {
        const { data } = await axios.put(`/api/projects/${projectId}`, projectData)
        const payload = data.data ?? data
        commit('UPDATE_PROJECT', payload)
        return payload
    },

    // Обновить изображение
    async updateImage({ commit }, { projectId, batchId, imageId, imageData }) {
        const { data } = await axios.put(`/api/projects/${projectId}/batches/${batchId}/images/${imageId}`, imageData)
        const payload = data.data ?? data
        commit('UPDATE_IMAGE_IN_BATCH', { projectId, batchId, imageId, updatedImage: payload })
        return payload
    }
}

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions
}
