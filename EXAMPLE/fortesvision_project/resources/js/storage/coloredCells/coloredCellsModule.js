import axios from 'axios'

const state = () => ({
    // key: `${projectId}:${batchId}:${imageId}:${date}` -> { statusId, completed, color }
    cellsByKey: {},
    // Временное выделение ячеек пользователем
    selectedKeys: new Set(),
})

const getters = {
    getCell: (state) => (projectId, batchId, imageId, date) => {
        const key = `${projectId}:${batchId}:${imageId}:${date}`
        return state.cellsByKey[key] || null
    },
    isSelected: (state) => (projectId, batchId, imageId, date) => {
        const key = `${projectId}:${batchId}:${imageId}:${date}`
        return state.selectedKeys.has(key)
    },
    hasSelectedCellsWithStatus: (state) => {
        for (const key of state.selectedKeys) {
            const cell = state.cellsByKey[key]
            if (cell && cell.statusId) return true
        }
        return false
    },
    isSelectedGroupCompleted: (state) => {
        if (state.selectedKeys.size === 0) return false
        for (const key of state.selectedKeys) {
            const cell = state.cellsByKey[key]
            if (!cell || !cell.completed) return false
        }
        return true
    }
}

const mutations = {
    // Внутренний помощник для нормализации даты к YYYY-MM-DD
    _normalizeDate(_, date) {
        if (!date) return date
        if (typeof date === 'string') return date.split('T')[0]
        try {
            const d = new Date(date)
            return isNaN(d.getTime()) ? date : d.toISOString().split('T')[0]
        } catch (e) {
            return date
        }
    },
    setCells(state, cells) {
        for (const cell of cells) {
            const dateKey = mutations._normalizeDate(null, cell.date)
            const key = `${cell.project_id}:${cell.batch_id}:${cell.image_id}:${dateKey}`
            state.cellsByKey[key] = {
                id: cell.id,
                statusId: cell.status_id,
                completed: !!cell.completed,
            }
        }
    },
    upsertCells(state, rows) {
        for (const row of rows) {
            const dateKey = mutations._normalizeDate(null, row.date)
            const key = `${row.project_id}:${row.batch_id}:${row.image_id}:${dateKey}`
            state.cellsByKey[key] = {
                ...(state.cellsByKey[key] || {}),
                statusId: row.status_id,
                completed: !!row.completed,
            }
        }
    },
    removeCells(state, rows) {
        for (const row of rows) {
            const dateKey = mutations._normalizeDate(null, row.date)
            const key = `${row.project_id}:${row.batch_id}:${row.image_id}:${dateKey}`
            delete state.cellsByKey[key]
            state.selectedKeys.delete(key)
        }
    },
    selectKeys(state, keys) {
        for (const key of keys) state.selectedKeys.add(key)
    },
    clearSelection(state) {
        state.selectedKeys = new Set()
    },
    unselectKeys(state, keys) {
        for (const key of keys) state.selectedKeys.delete(key)
    },
}

const actions = {
    async fetchByImageAndPeriod({ commit }, { projectId, batchId, imageId, from, to }) {
        const { data } = await axios.get(`/api/projects/${projectId}/batches/${batchId}/images/${imageId}/colored-cells`, {
            params: { from, to }
        })
        commit('setCells', data.cells || [])
        return data.cells
    },
    async fetchByImageAndPeriodWithDelay({ commit }, { projectId, batchId, imageId, from, to }) {
        const { data } = await axios.get(`/api/projects/${projectId}/batches/${batchId}/images/${imageId}/colored-cells/delay`, {
            params: { from, to }
        })
        commit('setCells', data.cells || [])
        return data.cells
    },

    async bulkColor({ commit }, { items }) {
        const { data } = await axios.post('/api/colored-cells/bulk-color', { items })
        commit('setCells', data.cells || [])
        return data.cells
    },

    async bulkDelete({ commit }, { items }) {
        await axios.post('/api/colored-cells/bulk-delete', { items })
        commit('removeCells', items)
        return true
    },

    async loadBatchColoredCellsByDateRange({ dispatch, rootGetters }, { projectId, batchId, startDate, endDate }) {
        const images = rootGetters['projects/getBatchImages'](projectId, batchId) || []
        if (!images.length) return []

        const from = startDate
        const to = endDate

        const results = await Promise.all(
            images.map(image =>
                dispatch('fetchByImageAndPeriodWithDelay', { // fetchByImageAndPeriodWithDelay
                    projectId,
                    batchId,
                    imageId: image.id,
                    from,
                    to,
                })
            )
        )
        return results.flat()
    },

    async clearBatchColoredCellsByDateRange({ commit, state }, { projectId, batchId, startDate, endDate }) {
        const from = startDate
        const to = endDate
        const items = []
        for (const key of Object.keys(state.cellsByKey)) {
            const [pId, bId, imageId, date] = key.split(':')
            if (String(pId) !== String(projectId) || String(bId) !== String(batchId)) continue
            if (date >= from && date <= to) {
                items.push({ project_id: Number(pId), batch_id: Number(bId), image_id: Number(imageId), date })
            }
        }
        if (items.length) {
            commit('removeCells', items)
        }
        return true
    },

    selectCellsByDescriptors({ commit }, descriptors) {
        const keys = descriptors.map(d => `${d.project_id}:${d.batch_id}:${d.image_id}:${d.date}`)
        commit('selectKeys', keys)
    },
    clearSelection({ commit }) {
        commit('clearSelection')
    },

    unselectCellsByDescriptors({ commit }, descriptors) {
        const keys = descriptors.map(d => `${d.project_id}:${d.batch_id}:${d.image_id}:${d.date}`)
        commit('unselectKeys', keys)
    },
}

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
}

