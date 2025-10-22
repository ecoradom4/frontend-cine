import axios, { AxiosInstance } from "axios"

export interface UserBooking {
  id: string
  transaction_id: string
  total_price: string
  status: string
  purchase_date: string
  receipt_url: string
  showtime: {
    time: string
    date: string
    movie: { title: string; poster: string }
    room: { name: string; location: string }
  }
  bookingSeats: {
    seat: { row: string; number: number }
  }[]
}

export interface UserBookingsResponse {
  success: boolean
  data: {
    bookings: UserBooking[]
  }
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://backend-cine-b0xw.onrender.com/api"

const SERVER_BASE_URL = API_BASE_URL.replace(/\/api$/, "")

class BookingsUserApiService {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: { "Content-Type": "application/json" },
    })

    // Interceptor: agrega token JWT si existe
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem("cine-connect-token")
      if (token) config.headers.Authorization = `Bearer ${token}`
      return config
    })
  }

  /**
   * Obtiene las reservas del usuario autenticado
   */
  async getUserBookings(limit = 50): Promise<UserBooking[]> {
    try {
      const res = await this.client.get<UserBookingsResponse>(`/bookings/user?limit=${limit}`)

      // 🔧 Normalizar URLs relativas a absolutas (puerto 4000)
      const normalized = res.data.data.bookings.map((b) => ({
        ...b,
        receipt_url: b.receipt_url.startsWith("http")
          ? b.receipt_url
          : `${SERVER_BASE_URL}${b.receipt_url}`,
      }))

      return normalized
    } catch (error: any) {
      console.error("Error al obtener reservas:", error)
      throw new Error(
        error?.response?.data?.message || "No se pudieron cargar las reservas del usuario."
      )
    }
  }
}

export const bookingsUserApi = new BookingsUserApiService()
