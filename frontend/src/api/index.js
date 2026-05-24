import axios from 'axios';
import { Message } from 'element-ui';
import router from '../router';

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
});

request.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  response => {
    const res = response.data;
    if (res.code === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
      Message.warning('请重新登录');
      return Promise.reject(new Error(res.message));
    }
    if (res.code === 403) {
      Message.error('权限不足');
      return Promise.reject(new Error(res.message));
    }
    return res;
  },
  error => {
    Message.error('网络请求失败');
    return Promise.reject(error);
  }
);

export default request;
