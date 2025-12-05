const state = {
    showModal: false,
    projectId: null,
    batchId: null,
    imageId: null
}

const getters = {
    showModal: (state) => state.showModal,
    projectId: (state) => state.projectId,
    batchId: (state) => state.batchId,
    imageId: (state) => state.imageId
}

const mutations = {
    SHOW_MODAL(state, { projectId, batchId, imageId }) {
        state.showModal = true
        state.projectId = projectId
        state.batchId = batchId
        state.imageId = imageId
    },

    HIDE_MODAL(state) {
        state.showModal = false
        state.projectId = null
        state.batchId = null
        state.imageId = null
    }
}

const actions = {
    showModal({ commit }, { projectId, batchId, imageId }) {
        commit('SHOW_MODAL', { projectId, batchId, imageId })
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
