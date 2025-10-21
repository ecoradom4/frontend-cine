// src/services/movieService.ts
import type { Movie } from "@/components/movies/movie-card";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Extender el tipo Movie para incluir status
export interface MovieWithStatus extends Movie {
  status: 'active' | 'inactive';
}

export interface MovieInput {
  title: string;
  genre: string;
  duration: number;
  rating: number;
  description: string;
  price: number;
  release_date: string;
  poster?: string;
  status?: 'active' | 'inactive';
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse {
  movies: MovieWithStatus[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Función para obtener el token de forma segura (usando el mismo que dashboard)
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('cine-connect-token');
  }
  return null;
};

// Función para normalizar las películas del backend
const normalizeMovie = (movie: any): MovieWithStatus => {
  return {
    id: movie.id,
    title: movie.title,
    genre: movie.genre,
    duration: Number(movie.duration),
    rating: Number(movie.rating),
    description: movie.description,
    price: Number(movie.price),
    releaseDate: movie.release_date || movie.releaseDate,
    poster: movie.poster,
    status: movie.status || 'active',
    showtimes: movie.showtimes || [],
    createdAt: movie.createdAt,
    updatedAt: movie.updatedAt,
  };
};

// Función para ordenar películas: activas primero, luego por fecha de estreno
const sortMovies = (movies: MovieWithStatus[]): MovieWithStatus[] => {
  return [...movies].sort((a, b) => {
    // Primero ordenar por status: activas primero
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;
    
    // Luego ordenar por fecha de estreno (más recientes primero)
    const dateA = new Date(a.releaseDate);
    const dateB = new Date(b.releaseDate);
    return dateB.getTime() - dateA.getTime();
  });
};

class MovieService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = getAuthToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (response.status === 401) {
        // Token expirado o inválido - redirigir a /auth
        localStorage.removeItem('cine-connect-token');
        if (typeof window !== 'undefined') {
          window.location.href = '/auth';
        }
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error de conexión');
    }
  }

  // 🔹 MÉTODO ORIGINAL - Para compatibilidad con código existente
  async getMovies(params?: {
    search?: string;
    genre?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse> {
    // Por defecto, usar el método de cartelera (solo activas)
    return this.getMoviesForShowcase(params);
  }

  // 🔹 Obtener películas para la cartelera (solo activas)
  async getMoviesForShowcase(params?: {
    search?: string;
    genre?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.search) queryParams.append('search', params.search);
    if (params?.genre && params.genre !== 'Todos') queryParams.append('genre', params.genre);
    // Para la cartelera, usar status=active (valor por defecto del backend)
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = `/movies${queryString ? `?${queryString}` : ''}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json() as ApiResponse<PaginatedResponse>;
    
    if (!result.success) {
      throw new Error(result.message || 'Error al obtener películas');
    }

    return {
      ...result.data!,
      movies: result.data!.movies.map(normalizeMovie)
    };
  }

  // 🔹 Obtener TODAS las películas para administración (activas e inactivas)
  async getAllMoviesForAdmin(params?: {
    search?: string;
    genre?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse> {
    // Hacer dos llamadas: una para activas y otra para inactivas
    const [activeResponse, inactiveResponse] = await Promise.all([
      this.fetchMoviesWithStatus('active', params),
      this.fetchMoviesWithStatus('inactive', params)
    ]);

    // Combinar resultados
    const allMovies = [...activeResponse.movies, ...inactiveResponse.movies];
    const total = activeResponse.pagination.total + inactiveResponse.pagination.total;

    // Ordenar: activas primero, luego por fecha de estreno
    const sortedMovies = sortMovies(allMovies.map(normalizeMovie));

    return {
      movies: sortedMovies,
      pagination: {
        total,
        page: 1,
        totalPages: Math.ceil(total / (params?.limit || 20)),
        hasNext: false,
        hasPrev: false
      }
    };
  }

  // 🔹 Método auxiliar para obtener películas por status específico
  private async fetchMoviesWithStatus(status: string, params?: any): Promise<PaginatedResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.search) queryParams.append('search', params.search);
    if (params?.genre && params.genre !== 'Todos') queryParams.append('genre', params.genre);
    queryParams.append('status', status);
    if (params?.page) queryParams.append('page', '1'); // Siempre página 1 para combinación
    if (params?.limit) queryParams.append('limit', (params.limit * 2).toString()); // Límite mayor para compensar

    const queryString = queryParams.toString();
    const endpoint = `/movies${queryString ? `?${queryString}` : ''}`;
    
    const token = getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json() as ApiResponse<PaginatedResponse>;
    
    if (!result.success) {
      throw new Error(result.message || `Error al obtener películas ${status}`);
    }

    return result.data!;
  }

  // 🔹 Obtener películas activas con filtro opcional de status
  async getMoviesWithStatus(params?: {
    search?: string;
    genre?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.search) queryParams.append('search', params.search);
    if (params?.genre && params.genre !== 'Todos') queryParams.append('genre', params.genre);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = `/movies${queryString ? `?${queryString}` : ''}`;
    
    const token = getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json() as ApiResponse<PaginatedResponse>;
    
    if (!result.success) {
      throw new Error(result.message || 'Error al obtener películas');
    }

    return {
      ...result.data!,
      movies: result.data!.movies.map(normalizeMovie)
    };
  }

  // Obtener géneros disponibles (público - no requiere auth)
  async getGenres(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/movies/genres`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json() as ApiResponse<{ genres: string[] }>;
    
    if (!result.success) {
      throw new Error(result.message || 'Error al obtener géneros');
    }

    return result.data!.genres;
  }

  // Obtener película por ID (público - no requiere auth)
  async getMovieById(id: string): Promise<MovieWithStatus> {
    const response = await fetch(`${API_BASE_URL}/movies/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json() as ApiResponse<{ movie: MovieWithStatus }>;
    
    if (!result.success) {
      throw new Error(result.message || 'Error al obtener la película');
    }

    return normalizeMovie(result.data!.movie);
  }

  // Crear nueva película (requiere auth - admin)
  async createMovie(movieData: MovieInput): Promise<MovieWithStatus> {
    const response = await this.request<ApiResponse<{ movie: MovieWithStatus }>>('/movies', {
      method: 'POST',
      body: JSON.stringify(movieData),
    });

    if (!response.success) {
      throw new Error(response.message || 'Error al crear la película');
    }

    return normalizeMovie(response.data!.movie);
  }

  // Actualizar película (requiere auth - admin)
  async updateMovie(id: string, movieData: Partial<MovieInput>): Promise<MovieWithStatus> {
    const response = await this.request<ApiResponse<{ movie: MovieWithStatus }>>(`/movies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(movieData),
    });

    if (!response.success) {
      throw new Error(response.message || 'Error al actualizar la película');
    }

    return normalizeMovie(response.data!.movie);
  }

  // Eliminar película (requiere auth - admin)
  async deleteMovie(id: string): Promise<void> {
    const response = await this.request<ApiResponse<void>>(`/movies/${id}`, {
      method: 'DELETE',
    });

    if (!response.success) {
      throw new Error(response.message || 'Error al eliminar la película');
    }
  }
}

export const movieService = new MovieService();