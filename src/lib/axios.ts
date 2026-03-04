import axios, { type AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import { toast } from 'sonner';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_ENDPOINT,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // You can attach token here if needed
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    (error: AxiosError) => {
        // Handle global errors here
        const errorMessage = (error.response?.data as { message?: string })?.message || error.message || 'An unexpected error occurred';
        toast.error(errorMessage);

        if (error.response?.status === 401) {
            // Handle unauthorized access
            console.error('Unauthorized access - maybe redirect to login');
        }
        return Promise.reject(error);
    }
);

export default api;
