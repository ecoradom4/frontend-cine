// services/auth-api.ts

// URL base para producción/desarrollo
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 
  (import.meta.env 
    ? 'https://backend-cine-b0xw.onrender.com/api'
    : 'http://localhost:4000/api');

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
    console.log('🔧 API Base URL:', this.baseURL); // Para debugging
  }

  async login(credentials: LoginRequest): Promise<AuthData> {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        credentials: 'include', // 🔥 IMPORTANTE: Para cookies/tokens
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<AuthData> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Login failed');
      }

      return result.data;
    } catch (error) {
      console.error('Login API error:', error);
      throw new Error(error instanceof Error ? error.message : 'Network error');
    }
  }

  async register(userData: Omit<RegisterRequest, 'role'>): Promise<AuthData> {
    try {
      const registrationData: RegisterRequest = { ...userData, role: 'cliente' };

      const response = await fetch(`${this.baseURL}/auth/register`, {
        method: 'POST',
        credentials: 'include', // 🔥 IMPORTANTE
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<AuthData> = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Registration failed');
      }

      return result.data;
    } catch (error) {
      console.error('Register API error:', error);
      throw new Error(error instanceof Error ? error.message : 'Network error');
    }
  }

  async getProfile(token: string): Promise<User> {
    try {
      const response = await fetch(`${this.baseURL}/auth/profile`, {
        method: 'GET',
        credentials: 'include', // 🔥 IMPORTANTE
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<ProfileData> = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch profile');
      }

      return result.data.user;
    } catch (error) {
      console.error('GetProfile API error:', error);
      throw new Error(error instanceof Error ? error.message : 'Network error');
    }
  }

  async logout(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseURL}/auth/logout`, {
        method: 'POST',
        credentials: 'include', // 🔥 IMPORTANTE
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: result.success,
        message: result.message,
      };
    } catch (error) {
      console.error('Logout API error:', error);
      throw new Error(error instanceof Error ? error.message : 'Error al cerrar sesión');
    }
  }

  // 🔧 Nuevo método: Verificar salud del backend
  async healthCheck(): Promise<{ status: string }> {
    try {
      const baseHealthURL = this.baseURL.replace('/api', '');
      const response = await fetch(`${baseHealthURL}/health`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  }
}

export const authApi = new AuthApiService();