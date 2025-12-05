const state = {

    showDialog: false,

}

const mutations = {
    SHOW_DIALOG(state) {
        state.showDialog = true;

    },

    HIDE_DIALOG(state) {
        state.showDialog = false;
    },
}


const getters = {
    showDialog: state => state.showDialog
}

export default {
    namespaced: true,
    state,
    mutations,
    getters
}
