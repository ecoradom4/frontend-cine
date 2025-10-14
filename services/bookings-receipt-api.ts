// src/services/bookings-receipt-api.ts
import axios, { AxiosInstance } from "axios"

export interface BookingReceiptResponse {
  success: boolean
  message: string
  data: {
    download_url: string   // URL absoluto (http://localhost:4000/...)
    filename: string
    relative_url?: string  // opcional
  }
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"

class BookingsReceiptApiService {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: { "Content-Type": "application/json" },
    })

    // ✅ Interceptor para incluir token JWT automáticamente
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem("cine-connect-token")
      if (token) config.headers.Authorization = `Bearer ${token}`
      return config
    })
  }

  /**
   * 🔍 Obtiene los datos del recibo de una reserva específica.
   * @param bookingId ID de la reserva (no el transaction_id)
   * Endpoint: GET /api/bookings/:bookingId/receipt
   */
  async getReceipt(bookingId: string): Promise<BookingReceiptResponse> {
    if (!bookingId) {
      throw new Error("El ID de la reserva es obligatorio.")
    }

    try {
      const res = await this.client.get<BookingReceiptResponse>(
        `/bookings/${bookingId}/receipt`
      )
      return res.data
    } catch (error: any) {
      console.error("Error al obtener el recibo:", error)
      throw new Error(
        error?.response?.data?.message ||
          `No se pudo obtener el recibo del servidor para la reserva ${bookingId}.`
      )
    }
  }

  /**
   * 💾 Descarga directamente el archivo PDF del recibo.
   * @param bookingId ID de la reserva
   */
  async downloadReceipt(bookingId: string): Promise<void> {
    const response = await this.getReceipt(bookingId)

    if (!response?.success || !response.data?.download_url) {
      throw new Error("No se pudo obtener la URL de descarga del recibo.")
    }

    const { download_url, filename } = response.data

    try {
      // ✅ Crear enlace temporal para la descarga del PDF
      const link = document.createElement("a")
      link.href = download_url
      link.download = filename || "recibo.pdf"
      link.target = "_blank" // abre en nueva pestaña si es visualizable
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error("Error al intentar descargar el archivo:", err)
      throw new Error("No se pudo iniciar la descarga del recibo.")
    }
  }
}

export const bookingsReceiptApi = new BookingsReceiptApiService()
