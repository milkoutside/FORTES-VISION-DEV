const state = {
    showContextMenu: false,
    contextMenuPosition: { x: 0, y: 0 },
    selectedProjectId: null,
    selectedBatchId: null
}

const getters = {
    showContextMenu: (state) => state.showContextMenu,
    contextMenuPosition: (state) => state.contextMenuPosition,
    selectedProjectId: (state) => state.selectedProjectId,
    selectedBatchId: (state) => state.selectedBatchId
}

const mutations = {
    SHOW_CONTEXT_MENU(state, { x, y, projectId, batchId }) {
        // state.showContextMenu = true
        // state.contextMenuPosition = { x, y }
        // state.selectedProjectId = projectId
        // state.selectedBatchId = batchId
        // Сохраняем ID проекта и пакета
        state.selectedProjectId = projectId
        state.selectedBatchId = batchId

        // Ищем контейнер календаря
        const calendarContainer = document.querySelector('.menu-content');

        // Предполагаемые размеры контекстного меню
        const menuWidth = 180; // подставьте реальную ширину вашего меню
        const menuHeight = 150; // подставьте реальную высоту вашего меню

        let adjustedX = x;
        let adjustedY = y;

        if (calendarContainer) {
            // Получаем границы контейнера календаря
            const containerRect = calendarContainer.getBoundingClientRect();

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
            console.warn('Calendar container not found, using original position');
        }

        // Устанавливаем позицию и отображаем меню
        state.contextMenuPosition = { x: adjustedX, y: adjustedY };
        state.showContextMenu = true;

    },

    HIDE_CONTEXT_MENU(state) {
        state.showContextMenu = false
        state.contextMenuPosition = { x: 0, y: 0 }
       // state.selectedProjectId = null
      //  state.selectedBatchId = null
    },

    SET_CONTEXT_MENU_POSITION(state, position) {
        state.contextMenuPosition = position
    },

    SET_SELECTED_PROJECT_ID(state, projectId) {
        state.selectedProjectId = projectId
    },

    SET_SELECTED_BATCH_ID(state, batchId) {
        state.selectedBatchId = batchId
    }
}

const actions = {
    showContextMenu({ commit }, { x, y, projectId, batchId }) {
        commit('SHOW_CONTEXT_MENU', { x, y, projectId, batchId })
    },

    hideContextMenu({ commit }) {
        commit('HIDE_CONTEXT_MENU')
    },

    setContextMenuPosition({ commit }, position) {
        commit('SET_CONTEXT_MENU_POSITION', position)
    },

    setSelectedProjectId({ commit }, projectId) {
        commit('SET_SELECTED_PROJECT_ID', projectId)
    },

    setSelectedBatchId({ commit }, batchId) {
        commit('SET_SELECTED_BATCH_ID', batchId)
    }
}

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions
}
