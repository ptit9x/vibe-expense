export interface User {
    id: string;
    email: string;
    name?: string;
}

export interface AuthRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}
