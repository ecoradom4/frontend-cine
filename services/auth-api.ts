// services/auth-api.ts
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000/api';

export interface User {
  id: string
  name: string
  email: string
  role: 'cliente' | 'admin'
  phone?: string | null
  createdAt: string
  updatedAt: string
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface AuthData {
  user: User;
  token: string;
}

interface ProfileData {
  user: User;
}

class AuthApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async login(credentials: LoginRequest): Promise<AuthData> {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const result: ApiResponse<AuthData> = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Login failed');
    }

    return result.data;
  }

  async register(userData: Omit<RegisterRequest, 'role'>): Promise<AuthData> {
    // Siempre establecer el rol como "cliente" automáticamente
    const registrationData: RegisterRequest = {
      ...userData,
      role: 'cliente'
    };

    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrationData),
    });

    const result: ApiResponse<AuthData> = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Registration failed');
    }

    return result.data;
  }

  async getProfile(token: string): Promise<User> {
    const response = await fetch(`${this.baseURL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const result: ApiResponse<ProfileData> = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to fetch profile');
    }

    return result.data.user;
  }
}

export const authApi = new AuthApiService();