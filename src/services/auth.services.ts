import api from "@/lib/axios";
import type { AuthRequest, AuthResponse } from "@/types/auth";

export const authService = {
    login: async (data: AuthRequest): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>("/login", data);
        return response.data;
    },
    register: async (data: AuthRequest): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>("/register", data);
        return response.data;
    },
};
