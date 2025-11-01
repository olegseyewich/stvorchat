import axios, { AxiosHeaders } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  if (authToken) {
    const headers =
      config.headers instanceof AxiosHeaders
        ? config.headers
        : new AxiosHeaders(config.headers ?? {});
    headers.set("Authorization", `Bearer ${authToken}`);
    config.headers = headers;
  }
  return config;
});

export interface ApiError {
  message: string;
  status?: number;
  details?: unknown;
}

export const parseApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = (error.response?.data as { message?: string })?.message ?? error.message;
    return { message, status, details: error.response?.data };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: "Unexpected error" };
};

