import request from './index';

export function getReimbursements(params) {
  return request.get('/reimbursements', { params });
}

export function getReimbursement(id) {
  return request.get(`/reimbursements/${id}`);
}

export function createReimbursement(data) {
  return request.post('/reimbursements', data);
}

export function updateReimbursement(id, data) {
  return request.put(`/reimbursements/${id}`, data);
}

export function deleteReimbursement(id) {
  return request.delete(`/reimbursements/${id}`);
}
