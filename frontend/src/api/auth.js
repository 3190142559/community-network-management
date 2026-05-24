import request from './index';

export function login(data) {
  return request.post('/auth/login', data);
}

export function getUserInfo() {
  return request.get('/auth/userinfo');
}

export function register(data) {
  return request.post('/auth/register', data);
}

export function getUsers(params) {
  return request.get('/auth/users', { params });
}

export function updateUser(id, data) {
  return request.put(`/auth/users/${id}`, data);
}

export function deleteUser(id) {
  return request.delete(`/auth/users/${id}`);
}

export function getCommunities() {
  return request.get('/auth/communities');
}
