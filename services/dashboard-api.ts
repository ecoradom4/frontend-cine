import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"

// --- Estadísticas generales ---
export interface DashboardStats {
  totalSales: number
  totalTickets: number
  averagePrice: number
  activeMovies: number
  totalUsers: number
  occupancyRate: number
  salesGrowth: number
}

// --- Ventas por película ---
export interface SalesByMovie {
  movieTitle: string
  totalSales: number
  ticketCount: number
}

// --- Tendencias diarias ---
export interface DailyTrend {
  fecha: string
  ventas: number
  boletos: number
  fullDate: string
}

// --- Distribución por género ---
export interface GenreDistribution {
  name: string
  value: number
}

// --- Ocupación por sala ---
export interface ShowtimeDetail {
  showtimeId: string
  date: string
  time: string
  movieTitle: string
  movieGenre: string
  duration: number
  occupiedSeats: number
  totalSeats: number
  price: number
  occupancyPercentage: number
  revenue: number
  occupancyStatus: "low" | "medium" | "high" | "full"
}

export interface RoomOccupancy {
  id: string
  name: string
  capacity: number
  location: string
  type: string
  status: string
  totalShowtimes: number
  avgOccupancy: number
  maxOccupancy: number
  minOccupancy: number
  totalRevenue: number
  occupancyCounts: {
    low: number
    medium: number
    high: number
    full: number
  }
  occupancyStatus: "low" | "medium" | "high" | "full"
  hasShowtimes: boolean
  showtimes: ShowtimeDetail[]
}

export interface RoomOccupancyResponse {
  roomOccupancy: RoomOccupancy[]
  filterApplied: {
    location: string | null
    period: string
    customDate: string | null
    dateRange: {
      start: string
      end: string
      label: string
    }
  }
  summary: {
    totalRooms: number
    roomsWithShowtimes: number
    totalShowtimes: number
    overallAvgOccupancy: number
    totalRevenue: number
    totalOccupiedSeats: number
  }
  message?: string
}

export interface LocationsResponse {
  locations: string[]
  total: number
  message?: string
}

// --- Exportación de reportes ---
export interface ExportReportParams {
  period: string
  format?: "excel" | "pdf"
}

// =========================
// ⚙️ API de Dashboard
// =========================

export const dashboardApi = {
  // 🔹 Estadísticas generales
  async getStats(period: string = "week"): Promise<DashboardStats> {
    const response = await axios.get(`${API_BASE_URL}/dashboard/stats`, {
      params: { period },
      headers: {
        Authorization: `Bearer ${localStorage.getItem("cine-connect-token")}`,
      },
    })
    if (response.data.success) {
      return response.data.data.stats
    } else {
      throw new Error("Error al obtener estadísticas del dashboard")
    }
  },

  // 🔹 Ventas por película
  async getSalesByMovie(period: string = "week"): Promise<SalesByMovie[]> {
    const response = await axios.get(`${API_BASE_URL}/dashboard/sales-by-movie`, {
      params: { period },
      headers: {
        Authorization: `Bearer ${localStorage.getItem("cine-connect-token")}`,
      },
    })
    if (response.data.success) {
      return response.data.data.salesByMovie
    } else {
      throw new Error("Error al obtener ventas por película")
    }
  },

  // 🔹 Tendencias diarias
  async getDailyTrends(period: string = "week"): Promise<DailyTrend[]> {
    const response = await axios.get(`${API_BASE_URL}/dashboard/daily-trends`, {
      params: { period },
      headers: {
        Authorization: `Bearer ${localStorage.getItem("cine-connect-token")}`,
      },
    })
    if (response.data.success) {
      return response.data.data.dailyTrends
    } else {
      throw new Error("Error al obtener tendencias diarias")
    }
  },

  // 🔹 Distribución por género
  async getGenreDistribution(period: string = "month"): Promise<GenreDistribution[]> {
    const response = await axios.get(`${API_BASE_URL}/dashboard/genre-distribution`, {
      params: { period },
      headers: {
        Authorization: `Bearer ${localStorage.getItem("cine-connect-token")}`,
      },
    })
    if (response.data.success) {
      return response.data.data.genreDistribution
    } else {
      throw new Error("Error al obtener distribución por género")
    }
  },

  // 🔹 Ocupación por sala (con filtros actualizados)
  async getRoomOccupancy(params?: {
    location?: string
    period?: string
    customDate?: string
  }): Promise<RoomOccupancyResponse> {
    const response = await axios.get(`${API_BASE_URL}/dashboard/room-occupancy`, {
      params: params || {},
      headers: {
        Authorization: `Bearer ${localStorage.getItem("cine-connect-token")}`,
      },
    })
    if (response.data.success) {
      return response.data.data
    } else {
      throw new Error("Error al obtener ocupación por sala")
    }
  },

  // 🔹 Ubicaciones disponibles
  async getAvailableLocations(): Promise<LocationsResponse> {
    const response = await axios.get(`${API_BASE_URL}/dashboard/locations`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("cine-connect-token")}`,
      },
    })
    if (response.data.success) {
      return response.data.data
    } else {
      throw new Error("Error al obtener ubicaciones disponibles")
    }
  },

  // 🔹 Exportar reporte de ventas
  async exportReport(params: ExportReportParams): Promise<Blob> {
    const { period, format = "excel" } = params;
    
    const response = await axios.get(`${API_BASE_URL}/dashboard/export-report`, {
      params: { period, format },
      headers: {
        Authorization: `Bearer ${localStorage.getItem("cine-connect-token")}`,
      },
      responseType: 'blob', // Importante para manejar archivos binarios
    })

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error("Error al exportar el reporte");
    }
  },

  // 🔹 Método auxiliar para descargar el reporte
  async downloadReport(params: ExportReportParams): Promise<void> {
    try {
      const blob = await this.exportReport(params);
      
      // Determinar la extensión del archivo según el formato
      const extension = params.format === 'pdf' ? 'pdf' : 'xlsx';
      const filename = `reporte-ventas-${params.period}.${extension}`;
      
      // Crear URL para descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error descargando reporte:', error);
      throw new Error('No se pudo descargar el reporte');
    }
  }
}
