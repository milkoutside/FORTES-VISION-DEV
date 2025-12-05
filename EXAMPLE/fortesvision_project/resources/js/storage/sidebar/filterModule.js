const state = {
    searchQuery: '',
    selectedUsers: [],
    isLoading: false,
    filteredProjects: []
}

const getters = {
    searchQuery: (state) => state.searchQuery,
    selectedUsers: (state) => state.selectedUsers,
    isLoading: (state) => state.isLoading,
    filteredProjects: (state) => state.filteredProjects,

    // Проверяем, есть ли активные фильтры
    hasActiveFilters: (state) => {
        return state.selectedUsers.length > 0 ||
            state.searchQuery.trim().length > 0
    },

    // Получаем все активные фильтры
    allFilters: (state) => {
        return [...state.selectedUsers]
    }
}

const mutations = {
    SET_SEARCH_QUERY(state, query) {
        state.searchQuery = query
    },

    SET_SELECTED_USERS(state, users) {
        state.selectedUsers = users
    },

    SET_LOADING(state, loading) {
        state.isLoading = loading
    },

    SET_FILTERED_PROJECTS(state, projects) {
        state.filteredProjects = projects
    },

    CLEAR_ALL_FILTERS(state) {
        state.searchQuery = ''
        state.selectedUsers = []
        state.filteredProjects = []
    }
}

const actions = {
    // Установить поисковый запрос
    setSearchQuery({ commit }, query) {
        commit('SET_SEARCH_QUERY', query)
    },

    // Установить выбранных пользователей
    setSelectedUsers({ commit }, users) {
        commit('SET_SELECTED_USERS', users)
    },



    // Установить фильтры
    setFilters({ commit }, filters) {
        commit('SET_SELECTED_USERS', filters)
    },

    // Очистить все фильтры
    clearAllFilters({ commit }) {
        commit('CLEAR_ALL_FILTERS')
    },

    // Поиск проектов по фильтрам
    async searchProjects({ commit, state, rootGetters, dispatch }) {
        commit('SET_LOADING', true)

        try {
            // Если есть активные фильтры или поиск - используем API
            if (state.searchQuery.trim() || state.selectedUsers.length > 0) {
                const selectedUserIds = state.selectedUsers.map(user =>
                    typeof user === 'object' ? user.id : user
                )

                const response = await dispatch('projects/fetchProjectsByPage', {
                    page: 1,
                    perPage: 100, // Загружаем больше для фильтрации
                    search: state.searchQuery.trim(),
                    userIds: selectedUserIds
                }, { root: true })

                const filtered = response?.projects || []
                console.log('Найдено отфильтрованных проектов:', filtered.length)
                console.log('Отфильтрованные проекты:', filtered)
                commit('SET_FILTERED_PROJECTS', filtered)
            } else {
                // Если нет фильтров - очищаем отфильтрованные проекты
                commit('SET_FILTERED_PROJECTS', [])
            }

        } catch (error) {
            console.error('Ошибка при поиске проектов:', error)
            commit('SET_FILTERED_PROJECTS', [])
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
