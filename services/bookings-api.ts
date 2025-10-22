import axios, { AxiosInstance } from "axios"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://backend-cine-b0xw.onrender.com/api"

// 🎫 Tipos de datos del backend actual
export interface SeatData {
  id: string
  row: string
  number: number
  type: string
}

export interface BookingSeat {
  id: string
  booking_id: string
  seat_id: string
  price: string
  seat: SeatData
}

export interface ShowtimeData {
  id: string
  movie_id: string
  room_id: string
  date: string
  time: string
  price: string
  movie: {
    id: string
    title: string
    genre: string
    duration: number
    rating: string
    poster: string
  }
  room: {
    id: string
    name: string
    type: string
    location: string
  }
}

export interface Booking {
  id: string
  transaction_id: string
  showtime_id: string
  user_id: string
  total_price: string
  status: string
  payment_method: string
  customer_email: string
  qr_code_data: string
  receipt_url: string
  purchase_date: string
  createdAt: string
  updatedAt: string
  showtime: ShowtimeData
  bookingSeats: BookingSeat[]
}

// 📦 Payload para crear una reserva
export interface BookingPayload {
  showtime_id: string
  seat_ids: string[]
  payment_method: string // "Tarjeta de Crédito"
  customer_email: string
}

// 📦 Respuesta del backend al crear una reserva
export interface BookingResponse {
  success: boolean
  message: string
  data: {
    booking: Booking
  }
}

// 🧩 Servicio principal
class BookingsApiService {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: { "Content-Type": "application/json" },
    })

    // Inyecta token JWT si está disponible
    this.client.interceptors.request.use((config) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("cine-connect-token")
        if (token) config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })
  }

  /**
   * 📦 Crea una nueva reserva
   * Endpoint: POST /api/bookings
   */
  async createBooking(payload: BookingPayload): Promise<BookingResponse> {
    try {
      const res = await this.client.post<BookingResponse>("/bookings", payload)
      return res.data
    } catch (err: any) {
      console.error("Error en createBooking:", err.response?.data || err)
      throw err.response?.data || err
    }
  }

  /**
   * 🔍 Obtiene una reserva específica
   * Endpoint: GET /api/bookings/:id
   */
  async getBookingById(id: string): Promise<Booking> {
    try {
      const res = await this.client.get<{ success: boolean; data: { booking: Booking } }>(
        `/bookings/${id}`
      )
      return res.data.data.booking
    } catch (err: any) {
      console.error("Error al obtener la reserva:", err.response?.data || err)
      throw err.response?.data || err
    }
  }

  /**
   * 📜 Lista todas las reservas del usuario autenticado
   * Endpoint: GET /api/bookings
   */
  async getUserBookings(): Promise<Booking[]> {
    try {
      const res = await this.client.get<{ success: boolean; data: { bookings: Booking[] } }>(
        "/bookings"
      )
      return res.data.data.bookings
    } catch (err: any) {
      console.error("Error al listar reservas:", err.response?.data || err)
      throw err.response?.data || err
    }
  }
}

export const bookingsApi = new BookingsApiService()
