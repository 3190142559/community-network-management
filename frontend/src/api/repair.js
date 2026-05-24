import request from './index';

export function getRepairs(params) {
  return request.get('/repairs', { params });
}

export function getRepair(id) {
  return request.get(`/repairs/${id}`);
}

export function createRepair(data) {
  return request.post('/repairs', data);
}

export function updateRepair(id, data) {
  return request.put(`/repairs/${id}`, data);
}

export function deleteRepair(id) {
  return request.delete(`/repairs/${id}`);
}
