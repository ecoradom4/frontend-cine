import axios from "axios"

export interface Seat {
  id: string
  row: string
  number: number
  type: string
  status: string
}

export interface Room {
  id: string
  name: string
  capacity: number
  type: string
  status: string
  location: string
  createdAt: string
  updatedAt: string
  seats: Seat[]
}

export interface GetRoomsParams {
  search?: string
  status?: string
  type?: string
  location?: string
}

export interface RoomsResponse {
  success: boolean
  data: {
    rooms: Room[]
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend-cine-b0xw.onrender.com/api"

export const roomsApi = {
  async getRooms(params?: GetRoomsParams): Promise<{ rooms: Room[] }> {
    const response = await axios.get<RoomsResponse>(`${API_BASE_URL}/rooms`, { params })
    if (response.data.success) {
      return { rooms: response.data.data.rooms }
    } else {
      throw new Error("Error al obtener salas")
    }
  },

  async getRoomById(id: string): Promise<Room> {
    const response = await axios.get<{ success: boolean; data: Room }>(`${API_BASE_URL}/rooms/${id}`)
    if (response.data.success) {
      return response.data.data
    } else {
      throw new Error("Error al obtener sala")
    }
  },
}
