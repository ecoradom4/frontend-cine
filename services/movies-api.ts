import axios, { AxiosInstance } from "axios";

// 🌐 Config base
const API_BASE_URL =
  (import.meta as any).env?.NEXT_PUBLIC_API_URL  || "https://backend-cine-b0xw.onrender.com/api";

// 🎬 Tipos del BACKEND (API)
export interface ApiShowtime {
  id: string;
  date: string;
  time: string;
  price: string;
  room?: {
    id: string;
    name: string;
    location: string;
  };
}


export interface ApiMovie {
  id: string;
  title: string;
  genre: string;
  duration: number;
  rating: string;
  poster: string;
  description: string;
  price: string;
  release_date: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  showtimes: ApiShowtime[];
}

export interface Pagination {
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// 🎨 Tipos del FRONTEND (usados por MovieCard y MovieGrid)
export interface UIMovie {
  id: string;
  title: string;
  genre: string;
  duration: number;
  rating: number;
  poster: string;
  description: string;
  showtimes: string[]; // formateadas
  price: number;
  releaseDate: string;
  status: string; 
}

// 🧩 Función normalizadora
export function normalizeMovie(apiMovie: ApiMovie): UIMovie {
  return {
    id: apiMovie.id,
    title: apiMovie.title,
    genre: apiMovie.genre,
    duration: apiMovie.duration,
    rating: parseFloat(apiMovie.rating || "0"),
    poster: apiMovie.poster,
    description: apiMovie.description,
    showtimes: (apiMovie.showtimes ?? []).map(
      (s) =>
        `${s.date} ${s.time} • ${s.room?.name ?? "Sala desconocida"} (${s.room?.location ?? "Ubicación desconocida"})`
    ),
    price: parseFloat(apiMovie.price || "0"),
    releaseDate: apiMovie.release_date,
    status: apiMovie.status,
  };
}




// 🚀 Servicio Axios
class MoviesApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: { "Content-Type": "application/json" },
    });

    // Token JWT si existe
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem("cine-connect-token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  async getMovies(params?: {
    search?: string;
    genre?: string;
    page?: number;
    limit?: number;
  }): Promise<{ movies: UIMovie[]; pagination: Pagination }> {
    const res = await this.client.get<ApiResponse<{ movies: ApiMovie[]; pagination: Pagination }>>(
      "/movies",
      { params }
    );

    // 🔄 Convertimos todas las películas al formato del frontend
    const movies = res.data.data.movies.map(normalizeMovie);
    return { movies, pagination: res.data.data.pagination };
  }

  async getMovieById(id: string): Promise<UIMovie> {
  const res = await this.client.get<ApiResponse<{ movie: ApiMovie }>>(`/movies/${id}`);
  const movie = res.data.data.movie;
  return normalizeMovie(movie);
}


  async getGenres(): Promise<string[]> {
    const res = await this.client.get<ApiResponse<{ genres: string[] }>>("/movies/genres");
    return res.data.data.genres;
  }

  async createMovie(movie: Partial<ApiMovie>): Promise<UIMovie> {
    const res = await this.client.post<ApiResponse<ApiMovie>>("/movies", movie);
    return normalizeMovie(res.data.data);
  }

  async updateMovie(id: string, movie: Partial<ApiMovie>): Promise<UIMovie> {
    const res = await this.client.put<ApiResponse<ApiMovie>>(`/movies/${id}`, movie);
    return normalizeMovie(res.data.data);
  }

  async deleteMovie(id: string): Promise<{ success: boolean; message: string }> {
    const res = await this.client.delete<ApiResponse<{ success: boolean; message: string }>>(
      `/movies/${id}`
    );
    return res.data.data;
  }
}

export const moviesApi = new MoviesApiService();
