import request from './index';

export function getOverview() {
  return request.get('/statistics/overview');
}

export function getDeviceStats() {
  return request.get('/statistics/devices');
}

export function getRepairStats() {
  return request.get('/statistics/repairs');
}

export function getReimbursementStats() {
  return request.get('/statistics/reimbursements');
}
