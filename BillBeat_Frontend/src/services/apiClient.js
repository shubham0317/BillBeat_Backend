import axios from 'axios';

const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/v1`,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 15000,
});

let tokenProvider = () => null;
let unauthorizedHandler = () => {};

export function configureApiClient({ getToken, onUnauthorized }) {
  tokenProvider = getToken || (() => null);
  unauthorizedHandler = onUnauthorized || (() => {});
}

apiClient.interceptors.request.use((config) => {
  const token = tokenProvider();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data?.data,
  (error) => {
    const status = error.response?.status;
    const payload = error.response?.data;
    if (status === 401) unauthorizedHandler();

    const normalizedError = new Error(
      payload?.message || error.message || 'Unable to complete the request.',
    );
    normalizedError.status = status;
    normalizedError.fieldErrors = payload?.data && typeof payload.data === 'object'
      ? payload.data
      : {};
    normalizedError.payload = payload;
    return Promise.reject(normalizedError);
  },
);

export default apiClient;
