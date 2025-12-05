const state = {
    showContextMenu: false,
    contextMenuPosition: {x: 0, y: 0},
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
    SHOW_CONTEXT_MENU(state, {x, y, projectId, batchId, imageId}) {
        // state.showContextMenu = true
        // state.contextMenuPosition = { x, y }
        // state.selectedProjectId = projectId
        // state.selectedBatchId = batchId
        // state.selectedImageId = imageId

        // Ищем контейнер меню
        const menuContainer = document.querySelector('.menu-content');

        // Предполагаемые размеры контекстного меню
        const menuWidth = 180; // подставьте реальную ширину вашего меню
        const menuHeight = 210; // подставьте реальную высоту вашего меню

        let adjustedX = x;
        let adjustedY = y;

        if (menuContainer) {
            // Получаем границы контейнера меню
            const containerRect = menuContainer.getBoundingClientRect();

            // Проверяем правый край контейнера
            if (x + menuWidth > containerRect.right) {
                adjustedX = x - 180; // смещаем меню влево
            }

            // Проверяем нижний край контейнера
            if (y + menuHeight > containerRect.bottom) {
                adjustedY = y - menuHeight;
            }

            // Проверяем левый край контейнера
            if (adjustedX < containerRect.left) {
                adjustedX = containerRect.left + 10; // небольшой отступ от края
            }

            // Проверяем верхний край контейнера
            if (adjustedY < containerRect.top) {
                adjustedY = containerRect.top + 10; // небольшой отступ от края
            }
        } else {
            console.warn('Menu container not found, using original position');
        }

        // Устанавливаем состояние
        state.showContextMenu = true;
        state.contextMenuPosition = {x: adjustedX, y: adjustedY};
        state.selectedProjectId = projectId;
        state.selectedBatchId = batchId;
        state.selectedImageId = imageId;

    },

    HIDE_CONTEXT_MENU(state) {
        state.showContextMenu = false
        state.contextMenuPosition = {x: 0, y: 0}
        //state.selectedProjectId = null
        //state.selectedBatchId = null
        // state.selectedImageId = null
    },

    SET_CONTEXT_MENU_POSITION(state, position) {
        state.contextMenuPosition = position
    },

    SET_SELECTED_PROJECT_ID(state, projectId) {
        state.selectedProjectId = projectId
    },

    SET_SELECTED_BATCH_ID(state, batchId) {
        state.selectedBatchId = batchId
    },

    SET_SELECTED_IMAGE_ID(state, imageId) {
        state.selectedImageId = imageId
    }
}

const actions = {
    showContextMenu({commit}, {x, y, projectId, batchId, imageId}) {
        commit('SHOW_CONTEXT_MENU', {x, y, projectId, batchId, imageId})
    },

    hideContextMenu({commit}) {
        commit('HIDE_CONTEXT_MENU')
    },

    setContextMenuPosition({commit}, position) {
        commit('SET_CONTEXT_MENU_POSITION', position)
    },

    setSelectedProjectId({commit}, projectId) {
        commit('SET_SELECTED_PROJECT_ID', projectId)
    },

    setSelectedBatchId({commit}, batchId) {
        commit('SET_SELECTED_BATCH_ID', batchId)
    },

    setSelectedImageId({commit}, imageId) {
        commit('SET_SELECTED_IMAGE_ID', imageId)
    }
}

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions
}
