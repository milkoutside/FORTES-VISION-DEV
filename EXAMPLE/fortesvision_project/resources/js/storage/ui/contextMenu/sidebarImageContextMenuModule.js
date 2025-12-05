const state = {
    showContextMenu: false,
    contextMenuPosition: { x: 0, y: 0 },
    selectedProjectId: null,
    selectedBatchId: null,
    selectedImageId: null
}

const getters = {
    showContextMenu: (state) => state.showContextMenu,
    contextMenuPosition: (state) => state.contextMenuPosition,
    selectedProjectId: (state) => state.selectedProjectId,
    selectedBatchId: (state) => state.selectedBatchId,
    selectedImageId: (state) => state.selectedImageId
}

const mutations = {
    SHOW_CONTEXT_MENU(state, { x, y, projectId, batchId, imageId }) {
        // Ищем контейнер сайдбара
        const menuContainer = document.querySelector('.menu-content');

        // Предполагаемая ширина и высота контекстного меню
        const menuWidth = 180;
        const menuHeight = 150;

        let adjustedX = x;
        let adjustedY = y;

        if (menuContainer) {
            const containerRect = menuContainer.getBoundingClientRect();

            if (x + menuWidth > containerRect.right) {
                adjustedX = x - menuWidth;
            }
            if (y + menuHeight > containerRect.bottom) {
                adjustedY = y - menuHeight;
            }
            if (adjustedX < containerRect.left) {
                adjustedX = containerRect.left + 10;
            }
            if (adjustedY < containerRect.top) {
                adjustedY = containerRect.top + 10;
            }
        }

        state.showContextMenu = true;
        state.contextMenuPosition = { x: adjustedX, y: adjustedY };
        state.selectedProjectId = projectId;
        state.selectedBatchId = batchId;
        state.selectedImageId = imageId;
    },

    HIDE_CONTEXT_MENU(state) {
        state.showContextMenu = false
        // Не очищаем выбранные ID намеренно, чтобы модалки могли их использовать сразу после клика
    },

    SET_CONTEXT_MENU_POSITION(state, position) {
        state.contextMenuPosition = position
    }
}

const actions = {
    showContextMenu({ commit }, { x, y, projectId, batchId, imageId }) {
        commit('SHOW_CONTEXT_MENU', { x, y, projectId, batchId, imageId })
    },

    hideContextMenu({ commit }) {
        commit('HIDE_CONTEXT_MENU')
    },

    setContextMenuPosition({ commit }, position) {
        commit('SET_CONTEXT_MENU_POSITION', position)
    }
}

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions
}
