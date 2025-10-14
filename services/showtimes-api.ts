import axios from "axios"
import { Room } from "./rooms-api"
import { UIMovie } from "./movies-api"

export interface Showtime {
  id: string
  movie_id: string
  room_id: string
  date: string
  time: string
  price: string
  available_seats: number
  total_seats: number
  createdAt: string
  updatedAt: string
  movie: UIMovie
  room: Room
  seats?: Seat[]
  booking_info?: {
    total_seats: number
    available_seats: number
    booked_seats: number
    occupancy_rate: string
  }
}

export interface Seat {
  id: string
  row: string
  number: number
  type: "standard" | "premium" | "vip"
  status: "available" | "occupied" | "maintenance"
  is_available?: boolean
}

export interface SeatsResponse {
  success: boolean
  data: {
    showtime: {
      id: string
      date: string
      time: string
      price: string
      available_seats: number
    }
    room: {
      id: string
      name: string
      capacity: number
    }
    seats: Seat[]
  }
}

export interface Pagination {
  total: number
  page: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface GetShowtimesParams {
  movieId?: string
  roomId?: string
  date?: string
  time?: string
  page?: number
  limit?: number
}

export interface ShowtimesResponse {
  success: boolean
  data: {
    showtimes: Showtime[]
    pagination: Pagination
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"

export const showtimesApi = {
  async getShowtimes(params?: GetShowtimesParams): Promise<{
    showtimes: Showtime[]
    pagination: Pagination
  }> {
    const response = await axios.get<ShowtimesResponse>(`${API_BASE_URL}/showtimes`, { params })
    if (response.data.success) {
      return {
        showtimes: response.data.data.showtimes,
        pagination: response.data.data.pagination,
      }
    } else {
      throw new Error("Error al obtener funciones")
    }
  },

  // ✅ Actualizado: nuevo formato /api/showtimes/{id}
  async getShowtimeById(id: string): Promise<Showtime> {
    const response = await axios.get(`${API_BASE_URL}/showtimes/${id}`)
    if (response.data.success && response.data.data?.showtime) {
      const s = response.data.data.showtime
      return {
        id: s.id,
        movie_id: s.movie_id,
        room_id: s.room_id,
        date: s.date,
        time: s.time,
        price: s.price,
        available_seats: s.available_seats,
        total_seats: s.total_seats,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        movie: s.movie,
        room: s.room,
        seats: s.seats,
        booking_info: s.booking_info,
      } as Showtime
    } else {
      throw new Error("Error al obtener función")
    }
  },

  // 🔹 Método opcional (aún usable si existe el endpoint separado)
  async getSeatsByShowtime(id: string): Promise<SeatsResponse["data"]> {
    const response = await axios.get<SeatsResponse>(`${API_BASE_URL}/showtimes/${id}/seats`)
    if (response.data.success) {
      return response.data.data
    } else {
      throw new Error("Error al obtener asientos de la función")
    }
  },

  // 🔹 Obtener asientos reservados (para marcar ocupados)
  async getReservedSeats(showtimeId: string): Promise<{ seat_id: string }[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/booking-seats?showtimeId=${showtimeId}`)
      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data
      }
      return []
    } catch (err) {
      console.error("Error al obtener asientos reservados:", err)
      return []
    }
  },
}
