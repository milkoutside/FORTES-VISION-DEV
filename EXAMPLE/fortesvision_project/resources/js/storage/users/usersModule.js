import axios from 'axios'

const state = {
    users: [],
    loading: false,
    error: null
}

const getters = {
    allUsers: (state) => state.users,
    isLoading: (state) => state.loading,
    error: (state) => state.error,

    // Получить пользователя по ID
    getUserById: (state) => (id) => state.users.find(user => user.id === id),

    // Получить пользователей по роли
    getUsersByRole: (state) => (role) => state.users.filter(user => user.role === role),

    // Получить всех менеджеров проектов
    getProjectManagers: (state) => state.users.filter(user => user.role === 'project_manager'),

    // Получить всех моделлеров
    getModellers: (state) => state.users.filter(user => user.role === 'modeller'),

    // Получить всех фрилансеров
    getFreelancers: (state) => state.users.filter(user => user.role === 'freelancer'),

    // Получить всех художников
    getArtists: (state) => state.users.filter(user => user.role === 'artist'),

    // Получить всех арт-директоров
    getArtDirectors: (state) => state.users.filter(user => user.role === 'art_director')
}

const mutations = {
    SET_USERS(state, users) {
        state.users = users
    },

    ADD_USER(state, user) {
        state.users.push(user)
    },

    UPDATE_USER(state, updatedUser) {
        const index = state.users.findIndex(u => u.id === updatedUser.id)
        if (index !== -1) {
            state.users.splice(index, 1, updatedUser)
        }
    },

    DELETE_USER(state, userId) {
        state.users = state.users.filter(u => u.id !== userId)
    },

    SET_LOADING(state, loading) {
        state.loading = loading
    },

    SET_ERROR(state, error) {
        state.error = error
    }
}

const actions = {
    // Загрузить всех пользователей
    async fetchAllUsers({ commit }) {
        commit('SET_LOADING', true)
        commit('SET_ERROR', null)

        try {
            const response = await axios.get('/api/users')
            const data = response.data

            if (data.success) {
                commit('SET_USERS', data.data)
            } else {
                throw new Error(data.message || 'Failed to fetch users')
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch users'
            commit('SET_ERROR', errorMessage)
            console.error('Error fetching users:', error)
        } finally {
            commit('SET_LOADING', false)
        }
    },

    // Создать нового пользователя
    async createUser({ commit }, userData) {
        commit('SET_LOADING', true)
        commit('SET_ERROR', null)

        try {
            const response = await axios.post('/api/users', userData)
            const data = response.data

            if (data.id) {
                commit('ADD_USER', data)
                return data
            } else {
                throw new Error(data.message || 'Failed to create user')
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to create user'
            commit('SET_ERROR', errorMessage)
            console.error('Error creating user:', error)
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    // Обновить пользователя
    async updateUser({ commit }, { id, userData }) {
        commit('SET_LOADING', true)
        commit('SET_ERROR', null)

        try {
            const response = await axios.put(`/api/users/${id}`, userData)
            const data = response.data

            if (data.id) {
                commit('UPDATE_USER', data)
                return data
            } else {
                throw new Error(data.message || 'Failed to update user')
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to update user'
            commit('SET_ERROR', errorMessage)
            console.error('Error updating user:', error)
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    // Удалить пользователя
    async deleteUser({ commit }, userId) {
        commit('SET_LOADING', true)
        commit('SET_ERROR', null)

        try {
            const response = await axios.delete(`/api/users/${userId}`)
            const data = response.data

            if (data.message) {
                commit('DELETE_USER', userId)
            } else {
                throw new Error(data.message || 'Failed to delete user')
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to delete user'
            commit('SET_ERROR', errorMessage)
            console.error('Error deleting user:', error)
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    // Получить пользователей по роли (с пагинацией)
    async fetchUsersByRole({ commit }, { role, page = 1, limit = 10, search = '' }) {
        commit('SET_LOADING', true)
        commit('SET_ERROR', null)

        try {
            const params = {
                role: role,
                page: page,
                limit: limit
            }

            if (search) {
                params.search = search
            }

            const response = await axios.get('/api/users/role', { params })
            const data = response.data

            if (Array.isArray(data)) {
                // Если это первая страница, заменяем пользователей
                if (page === 1) {
                    commit('SET_USERS', data)
                } else {
                    // Иначе добавляем к существующим
                    data.forEach(user => {
                        const existingIndex = state.users.findIndex(u => u.id === user.id)
                        if (existingIndex === -1) {
                            commit('ADD_USER', user)
                        }
                    })
                }
                return data
            } else {
                throw new Error('Invalid response format')
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch users by role'
            commit('SET_ERROR', errorMessage)
            console.error('Error fetching users by role:', error)
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    }
}

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions
}
