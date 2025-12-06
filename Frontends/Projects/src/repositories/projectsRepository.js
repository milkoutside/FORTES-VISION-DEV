import httpClient from './httpClient';

const resource = '/projects';

const unwrap = (response) => response?.data?.data;

export const fetchProjects = async (params = {}) => {
  const { 
    page = 1, 
    perPage = 100, 
    search = null, 
    userIds = null,
    managerIds = null,
    projectStatus = null,
    deadlineTypes = null,
    dateFrom = null,
    dateTo = null
  } = params;
  
  const queryParams = new URLSearchParams();
  queryParams.append('page', page.toString());
  queryParams.append('perPage', perPage.toString());
  
  if (search) {
    queryParams.append('search', search);
  }
  
  if (userIds && userIds.length > 0) {
    userIds.forEach(id => queryParams.append('userIds', id.toString()));
  }
  
  if (managerIds && managerIds.length > 0) {
    managerIds.forEach(id => queryParams.append('managerIds', id.toString()));
  }
  
  if (projectStatus && projectStatus.length > 0) {
    projectStatus.forEach(status => queryParams.append('projectStatus', status));
  }
  
  if (deadlineTypes && deadlineTypes.length > 0) {
    deadlineTypes.forEach(type => queryParams.append('deadlineTypes', type));
  }
  
  if (dateFrom) {
    queryParams.append('dateFrom', dateFrom);
  }
  
  if (dateTo) {
    queryParams.append('dateTo', dateTo);
  }
  
  const url = `${resource}?${queryParams.toString()}`;
  console.log('[projectsRepository] Запрос проектов с параметрами:', url);
  const response = await httpClient.get(url);
  console.log('[projectsRepository] Получено проектов:', response?.data?.data?.length);
  return {
    data: response?.data?.data ?? [],
    pagination: response?.data?.pagination ?? null,
  };
};

export const createProject = async (payload) => {
  const response = await httpClient.post(resource, payload);
  return unwrap(response);
};

export const attachProjectUsers = async (projectId, payload) => {
  const response = await httpClient.post(`${resource}/${projectId}/attach-users`, payload);
  return unwrap(response);
};

export const updateProject = async (projectId, payload) => {
  const response = await httpClient.put(`${resource}/${projectId}`, payload);
  return unwrap(response);
};

export const deleteProject = async (projectId) => {
  await httpClient.delete(`${resource}/${projectId}`);
  return true;
};

export default {
  fetchProjects,
  createProject,
  attachProjectUsers,
  updateProject,
  deleteProject,
};


