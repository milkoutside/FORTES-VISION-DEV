const state = {
    showModal: false,
    projectId: null
}

const getters = {
    showModal: (state) => state.showModal,
    projectId: (state) => state.projectId
}

const mutations = {
    SHOW_MODAL(state, projectId) {
        state.showModal = true
        state.projectId = projectId
    },

    HIDE_MODAL(state) {
        state.showModal = false
        state.projectId = null
    }
}

const actions = {
    showModal({ commit }, projectId) {
        commit('SHOW_MODAL', projectId)
    },

    hideModal({ commit }) {
        commit('HIDE_MODAL')
    }
}

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions
}
