import axios from "axios";

const state = {
    statuses: [], // Все статусы с сервера
    selectedStatus: null,
    isLoaded: false // Флаг для отслеживания загрузки
}

const mutations = {
    SET_ALL_STATUSES(state, statuses) {
        state.statuses = statuses
        state.isLoaded = true
    },
    SET_SELECTED_STATUS(state, status) {
        state.selectedStatus = status;
    },
    ADD_STATUS(state, status) {
        state.statuses.push(status)
    },
    UPDATE_STATUS(state, updatedStatus) {
        const index = state.statuses.findIndex(s => s.id === updatedStatus.id)
        if (index !== -1) {
            state.statuses.splice(index, 1, updatedStatus)
        }
    },
    DELETE_STATUS(state, id) {
        state.statuses = state.statuses.filter(s => s.id !== id)
        if (state.selectedStatus && state.selectedStatus.id === id) {
            state.selectedStatus = null
        }
    }
}

const actions = {
    async fetchAllStatuses({ commit, state }) {
        // Загружаем только если еще не загружены
        if (state.isLoaded) return;

        try {
            // Загружаем все статусы без фильтрации
            const response = await axios.get('api/statuses')
            commit('SET_ALL_STATUSES', response.data)
        } catch (error) {
            console.error('Error fetching all statuses:', error)
        }
    },

    selectStatus({ commit }, status) {
        commit('SET_SELECTED_STATUS', status);
    },

    async addStatus({ commit, state }, statusData) {
        try {
            const response = await axios.post('api/statuses', statusData)
            commit('ADD_STATUS', response.data)
            return response.data
        } catch (error) {
            console.error('Error adding status:', error)
            throw error
        }
    },

    async updateStatus({ commit, state }, statusData) {
        try {
            const response = await axios.put(`api/statuses/${statusData.id}`, statusData)
            commit('UPDATE_STATUS', response.data)
            return response.data
        } catch (error) {
            console.error('Error updating status:', error)
            throw error
        }
    },

    async deleteStatus({ commit }, statusId) {
        try {
            await axios.delete(`api/statuses/${statusId}`)
            commit('DELETE_STATUS', statusId)
        } catch (error) {
            console.error('Error deleting status:', error)
            throw error
        }
    }
}

const getters = {
    // Все статусы без фильтрации
    allStatuses: state => state.statuses,
    getStatusName: state => (id) => {
        let status = state.statuses.find(status => status.id === id);
        return status ? status.name : null;
    },
    selectedStatus: state => state.selectedStatus,
    delayStatus: state => () => {
        let status = state.statuses.find(status => status.name === "Delay");
        return status ? status : null;
    },
    weekendStatus: state => () => {
        let status = state.statuses.find(status => status.name === "Weekend");
        return status ? status : null;
    },
}

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters
}
