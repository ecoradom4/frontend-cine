// src/services/roomService.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// =========================
// 📊 Tipos de datos basados en los ENUMs del modelo
// =========================

export interface Seat {
  id: string;
  row: string;
  number: number;
  type: 'standard' | 'premium' | 'vip';
  status: 'available' | 'occupied' | 'maintenance';
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  type: 'Estándar' | 'Premium' | 'VIP' | 'IMAX' | '4DX';
  status: 'active' | 'maintenance' | 'inactive';
  location: 'Miraflores'| 'Antigua Telares'| 'Cayala'|'Oakland Mall';
  seats?: Seat[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RoomInput {
  name: string;
  capacity: number;
  type: 'Estándar' | 'Premium' | 'VIP' | 'IMAX' | '4DX';
  status?: 'active' | 'maintenance' | 'inactive';
  location: 'Miraflores'| 'Antigua Telares'| 'Cayala'|'Oakland Mall';
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface RoomsResponse {
  rooms: Room[];
}

export interface RoomResponse {
  room: Room;
}

export interface LocationsResponse {
  locations: string[];
}

// =========================
// 🎬 Servicio de Salas
// =========================

class RoomService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('cine-connect-token');
    
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

  // 🔹 Obtener todas las salas
  async getRooms(params?: {
    search?: string;
    status?: string;
    type?: string;
    location?: string;
  }): Promise<Room[]> {
    const queryParams = new URLSearchParams();
    
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.location) queryParams.append('location', params.location);

    const queryString = queryParams.toString();
    const endpoint = `/rooms${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.request<ApiResponse<RoomsResponse>>(endpoint);
    
    if (!response.success) {
      throw new Error(response.message || 'Error al obtener salas');
    }

    return response.data!.rooms;
  }

  // 🔹 Obtener sala por ID
  async getRoomById(id: string): Promise<Room> {
    const response = await this.request<ApiResponse<RoomResponse>>(`/rooms/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Error al obtener la sala');
    }

    return response.data!.room;
  }

  // 🔹 Crear nueva sala
  async createRoom(roomData: RoomInput): Promise<Room> {
    const response = await this.request<ApiResponse<RoomResponse>>('/rooms', {
      method: 'POST',
      body: JSON.stringify(roomData),
    });

    if (!response.success) {
      throw new Error(response.message || 'Error al crear la sala');
    }

    return response.data!.room;
  }

  // 🔹 Actualizar sala
  async updateRoom(id: string, roomData: Partial<RoomInput>): Promise<Room> {
    const response = await this.request<ApiResponse<RoomResponse>>(`/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roomData),
    });

    if (!response.success) {
      throw new Error(response.message || 'Error al actualizar la sala');
    }

    return response.data!.room;
  }

  // 🔹 Eliminar sala
  async deleteRoom(id: string): Promise<void> {
    const response = await this.request<ApiResponse<void>>(`/rooms/${id}`, {
      method: 'DELETE',
    });

    if (!response.success) {
      throw new Error(response.message || 'Error al eliminar la sala');
    }
  }

  // 🔹 Obtener ubicaciones disponibles
  async getLocations(): Promise<Array<'Miraflores'| 'Antigua Telares'| 'Cayala'|'Oakland Mall'>> {
    const response = await this.request<ApiResponse<LocationsResponse>>('/rooms/locations');
    
    if (!response.success) {
      throw new Error(response.message || 'Error al obtener ubicaciones');
    }

    // Asegurar que las ubicaciones sean del tipo correcto
    return response.data!.locations as Array<'Miraflores'| 'Antigua Telares'| 'Cayala'|'Oakland Mall'>;
  }

  // 🔹 Obtener tipos de sala disponibles (basado en el ENUM del modelo)
  getRoomTypes(): Array<'Estándar' | 'Premium' | 'VIP' | 'IMAX' | '4DX'> {
    return ['Estándar', 'Premium', 'VIP', 'IMAX', '4DX'];
  }

  // 🔹 Obtener estados disponibles (basado en el ENUM del modelo)
  getRoomStatuses(): Array<{ value: 'active' | 'maintenance' | 'inactive'; label: string }> {
    return [
      { value: 'active', label: 'Activa' },
      { value: 'maintenance', label: 'En Mantenimiento' },
      { value: 'inactive', label: 'Inactiva' }
    ];
  }

  // 🔹 Obtener ubicaciones disponibles (basado en el ENUM del modelo)
  getRoomLocations(): Array<{ value: 'Miraflores'| 'Antigua Telares'| 'Cayala'|'Oakland Mall'; label: string }> {
    return [
      { value: 'Miraflores', label: 'Miraflores' },
      { value: 'Antigua Telares', label: 'Antigua Telares' },
      { value: 'Cayala', label: 'Cayala' },
      { value: 'Oakland Mall', label: 'Oakland Mall' }
    ];
  }

  // 🔹 Obtener tipos de asiento disponibles (basado en el modelo Seat)
  getSeatTypes(): Array<{ value: 'standard' | 'premium' | 'vip'; label: string; description: string }> {
    return [
      { value: 'standard', label: 'Estándar', description: 'Asiento regular' },
      { value: 'premium', label: 'Premium', description: 'Asiento más cómodo' },
      { value: 'vip', label: 'VIP', description: 'Asiento de lujo' }
    ];
  }
}

export const roomService = new RoomService();