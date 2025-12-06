import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
} from '../../repositories/usersRepository';

const defaultPagination = {
  currentPage: 1,
  perPage: 10,
  total: 0,
  lastPage: 1,
};

const initialState = () => ({
  items: [],
  projectManagers: [],
  pagination: defaultPagination,
  isLoading: false,
  isSaving: false,
  hasLoaded: false,
  error: null,
});

const mutations = {
  setLoading(state, flag) {
    state.isLoading = flag;
  },
  setSaving(state, flag) {
    state.isSaving = flag;
  },
  setItems(state, items) {
    state.items = items;
  },
  setProjectManagers(state, managers) {
    state.projectManagers = managers;
  },
  setPagination(state, pagination) {
    state.pagination = pagination ?? defaultPagination;
  },
  setError(state, error) {
    state.error = error;
  },
  setHasLoaded(state, flag) {
    state.hasLoaded = flag;
  },
  addItem(state, item) {
    state.items = [...state.items, item];
    state.pagination = {
      ...state.pagination,
      total: state.pagination.total + 1,
      lastPage: Math.ceil((state.pagination.total + 1) / state.pagination.perPage),
    };
  },
  replaceItem(state, item) {
    state.items = state.items.map((existing) =>
      existing.id === item.id ? item : existing,
    );
  },
  removeItem(state, id) {
    state.items = state.items.filter((item) => item.id !== id);
    state.pagination = {
      ...state.pagination,
      total: Math.max(0, state.pagination.total - 1),
      lastPage: Math.max(1, Math.ceil(Math.max(0, state.pagination.total - 1) / state.pagination.perPage)),
    };
  },
  resetState(state) {
    Object.assign(state, initialState());
  },
};

const actions = {
  async fetchAll({ commit, state }, params = {}) {
    if (state.isLoading) return;
    commit('setLoading', true);
    commit('setError', null);
    try {
      const { items, pagination } = await fetchUsers(params);
      commit('setItems', items);
      commit('setPagination', pagination);
      commit('setHasLoaded', true);
    } catch (error) {
      commit('setError', error);
      throw error;
    } finally {
      commit('setLoading', false);
    }
  },
  async create({ commit }, payload) {
    commit('setSaving', true);
    commit('setError', null);
    try {
      const created = await createUser(payload);
      commit('addItem', created);
      return created;
    } catch (error) {
      commit('setError', error);
      throw error;
    } finally {
      commit('setSaving', false);
    }
  },
  async update({ commit }, { id, payload }) {
    commit('setSaving', true);
    commit('setError', null);
    try {
      const updated = await updateUser(id, payload);
      commit('replaceItem', updated);
      return updated;
    } catch (error) {
      commit('setError', error);
      throw error;
    } finally {
      commit('setSaving', false);
    }
  },
  async delete({ commit }, id) {
    commit('setSaving', true);
    commit('setError', null);
    try {
      await deleteUser(id);
      commit('removeItem', id);
    } catch (error) {
      commit('setError', error);
      throw error;
    } finally {
      commit('setSaving', false);
    }
  },
  async fetchProjectManagers({ commit }, search = '') {
    try {
      console.log('[users store] Начинаем загрузку менеджеров с поиском:', search);
      const { fetchProjectManagers } = await import('../../repositories/usersRepository');
      const managers = await fetchProjectManagers(search);
      console.log('[users store] Менеджеры получены:', managers);
      commit('setProjectManagers', managers);
      console.log('[users store] Менеджеры сохранены в state');
      return managers;
    } catch (error) {
      console.error('[users store] Ошибка загрузки менеджеров:', error);
      throw error;
    }
  },
  async searchProjectManagers(_, params = {}) {
    const { search = '' } = params;
    const { fetchProjectManagers } = await import('../../repositories/usersRepository');
    // Используем специальный endpoint для менеджеров с поддержкой поиска
    const managers = await fetchProjectManagers(search);
    return managers;
  },
  async search(_, params = {}) {
    const { search = '', limit = 20 } = params;
    const { items } = await fetchUsers({
      search,
      limit,
      page: 1,
    });
    return items;
  },
};

export default {
  namespaced: true,
  state: initialState,
  mutations,
  actions,
};

