import axios from 'axios';
import { API_BASE_URL as BASE_URL } from '../lib/config';

let accessToken = null;
let onUnauthorized = null;

export const setAccessToken = (t) => { accessToken = t; };
export const getAccessToken = () => accessToken;
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 25000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = 'Bearer ' + accessToken;
  return config;
});

let refreshPromise = null;

export const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(BASE_URL + '/auth/refresh', {}, { withCredentials: true })
      .then((res) => {
        const token = res.data?.data?.accessToken;
        setAccessToken(token);
        return token;
      })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
};

const NO_REFRESH = ['/auth/login', '/auth/refresh'];

api.interceptors.response.use(
  (res) => res.data,
  async (error) => {
    const { config, response } = error;

    if (!response) {
      return Promise.reject({ message: 'Cannot reach the API server.', code: 'NETWORK_ERROR' });
    }

    if (response.status === 401 && !config._retried && !NO_REFRESH.some((p) => config?.url?.includes(p))) {
      config._retried = true;
      try {
        const token = await refreshAccessToken();
        if (token) {
          config.headers.Authorization = 'Bearer ' + token;
          return api(config);
        }
      } catch (e) {
        setAccessToken(null);
        onUnauthorized?.();
      }
    }

    return Promise.reject({
      message: response.data?.message || 'Something went wrong',
      code: response.data?.code,
      errors: response.data?.errors,
      status: response.status,
    });
  }
);

export default api;
