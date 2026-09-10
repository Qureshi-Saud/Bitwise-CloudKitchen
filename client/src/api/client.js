import axios from 'axios';
import { API_BASE_URL as BASE_URL } from '../lib/config';

/** The access token lives in memory only; the refresh token is an httpOnly cookie. */
let accessToken = null;
let onUnauthorized = null;

export const setAccessToken = (token) => { accessToken = token; };
export const getAccessToken = () => accessToken;
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = 'Bearer ' + accessToken;
  return config;
});

/* -------- Single-flight refresh so a burst of 401s triggers only one call ------- */
let refreshPromise = null;

const refreshAccessToken = () => {
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

const NO_REFRESH = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/google'];

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const { config, response } = error;

    if (!response) {
      return Promise.reject({
        message: 'We could not reach the kitchen. Please check your internet connection.',
        code: 'NETWORK_ERROR',
      });
    }

    const skipRefresh = NO_REFRESH.some((p) => config?.url?.includes(p));

    if (response.status === 401 && !config._retried && !skipRefresh) {
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
      message: response.data?.message || 'Something went wrong. Please try again.',
      code: response.data?.code,
      errors: response.data?.errors,
      status: response.status,
    });
  }
);

export { refreshAccessToken };
export default api;
