// src/services/admin-showtimes-api.ts

import type { MovieWithStatus } from "@/services/movieService"
import type { Room } from "@/services/roomService"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend-cine-b0xw.onrender.com/api"


export interface Showtime {
  id: string
  movie_id: string
  room_id: string
  date: string // YYYY-MM-DD
  time: string // HH:MM
  price: number
  available_seats: number
  total_seats: number
  status?: "scheduled" | "cancelled" | "finished"
  createdAt?: string
  updatedAt?: string
  movie?: MovieWithStatus
  room?: Room
  ticket_prices?: {
    standard: string
    premium: string
    vip: string
  }
}

export interface ShowtimeInput {
  movie_id: string
  room_id: string
  date: string
  time: string
  price?: number
}

export interface ScheduleShowtimesPayload {
  movie_id: string
  room_id: string
  start_date: string
  end_date: string
  times: string[]
  excluded_days?: string[]
  price_override?: number
}

export interface ScheduleShowtimesResponse {
  success: boolean
  message: string
  summary?: {
    total_generated: number
    total_skipped: number
    date_range: { start_date: string; end_date: string }
    room: { id: string; name: string }
    movie: { id: string; title: string }
  }
  data?: {
    created: Showtime[]
    skipped: { date: string; time: string; reason: string }[]
  }
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  error?: string
}


const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("cine-connect-token")
  }
  return null
}


class AdminShowtimesService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = getAuthToken()

    if (!token) {
      throw new Error("No authentication token found")
    }

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

      // Manejar respuesta no autorizada
      if (response.status === 401) {
        localStorage.removeItem("cine-connect-token")
        if (typeof window !== "undefined") {
          window.location.href = "/auth"
        }
        throw new Error("Sesión expirada. Por favor, inicia sesión nuevamente.")
      }

      // Manejar otros errores HTTP
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error HTTP: ${response.status}`)
      }

      const data = await response.json()
      
      // Verificar estructura de respuesta del backend
      if (!data.success) {
        throw new Error(data.message || "Error en la respuesta del servidor")
      }

      return data

    } catch (error: any) {
      if (error.message === "Failed to fetch") {
        throw new Error("Error de conexión. Verifica que el servidor esté ejecutándose.")
      }
      throw error
    }
  }

  // 🔹 Obtener todas las funciones
  async getShowtimes(params?: { movieId?: string; roomId?: string; date?: string }): Promise<Showtime[]> {
    const queryParams = new URLSearchParams()
    if (params?.movieId) queryParams.append('movieId', params.movieId)
    if (params?.roomId) queryParams.append('roomId', params.roomId)
    if (params?.date) queryParams.append('date', params.date)

    const queryString = queryParams.toString()
    const endpoint = `/showtimes${queryString ? `?${queryString}` : ''}`

    const response = await this.request<{ data: { showtimes: Showtime[] } }>(endpoint)
    return response.data.showtimes
  }

  // 🔹 Obtener función por ID
  async getShowtimeById(id: string): Promise<Showtime> {
    const response = await this.request<{ data: { showtime: Showtime } }>(`/showtimes/${id}`)
    return response.data.showtime
  }

  // 🔹 Crear nueva función
  async createShowtime(showtimeData: ShowtimeInput): Promise<Showtime> {
    const response = await this.request<{ data: { showtime: Showtime } }>("/showtimes", {
      method: "POST",
      body: JSON.stringify(showtimeData),
    })
    return response.data.showtime
  }

  // 🔹 Actualizar función
  async updateShowtime(id: string, updateData: Partial<ShowtimeInput>): Promise<Showtime> {
    const response = await this.request<{ data: { showtime: Showtime } }>(`/showtimes/${id}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    })
    return response.data.showtime
  }

  // 🔹 Eliminar función
  async deleteShowtime(id: string): Promise<void> {
    await this.request(`/showtimes/${id}`, {
      method: "DELETE",
    })
  }

  // 🔹 Programar funciones en lote
  async scheduleShowtimes(payload: ScheduleShowtimesPayload): Promise<ScheduleShowtimesResponse> {
    const response = await this.request<{ data: ScheduleShowtimesResponse }>("/showtimes/schedule", {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return response.data
  }

  // 🔹 Obtener asientos disponibles
  async getAvailableSeats(showtimeId: string): Promise<{
    showtime: Showtime
    room: Room
    seats: any[]
  }> {
    const response = await this.request<{ data: any }>(`/showtimes/${showtimeId}/seats`)
    return response.data
  }
}


export const adminShowtimesService = new AdminShowtimesService()