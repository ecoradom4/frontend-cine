// src/hooks/useRooms.ts
import { useState, useEffect } from 'react';
import { 
  roomService, 
  type RoomInput, 
  type Room,
  type Seat 
} from '@/services/roomService';

// Opciones de configuración del hook
interface UseRoomsOptions {
  // Habilitar carga automática
  autoFetch?: boolean;
  // Filtros iniciales
  initialFilters?: {
    search?: string;
    status?: 'active' | 'maintenance' | 'inactive';
    type?: 'Estándar' | 'Premium' | 'VIP' | 'IMAX' | '4DX';
    location?: 'Miraflores'| 'Antigua Telares'| 'Cayala'|'Oakland Mall';
  };
}

export function useRooms(options: UseRoomsOptions = {}) {
  const { autoFetch = true, initialFilters = {} } = options;

  const [rooms, setRooms] = useState<Room[]>([]);
  const [locations, setLocations] = useState<Array<'Miraflores'| 'Antigua Telares'| 'Cayala'|'Oakland Mall'>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función principal para cargar salas
  const fetchRooms = async (params?: {
    search?: string;
    status?: 'active' | 'maintenance' | 'inactive';
    type?: 'Estándar' | 'Premium' | 'VIP' | 'IMAX' | '4DX';
    location?: 'Miraflores'| 'Antigua Telares'| 'Cayala'|'Oakland Mall';
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const roomsData = await roomService.getRooms(params);
      setRooms(roomsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar salas');
    } finally {
      setLoading(false);
    }
  };

  // Cargar ubicaciones disponibles
  const fetchLocations = async () => {
    try {
      const locationsData = await roomService.getLocations();
      setLocations(locationsData);
    } catch (err) {
      console.error('Error cargando ubicaciones:', err);
    }
  };

  // Crear nueva sala
  const createRoom = async (roomData: RoomInput): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      await roomService.createRoom(roomData);
      await fetchRooms(); // Recargar la lista
      await fetchLocations(); // Actualizar ubicaciones
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear sala');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar sala existente
  const updateRoom = async (id: string, roomData: Partial<RoomInput>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      await roomService.updateRoom(id, roomData);
      await fetchRooms(); // Recargar la lista
      await fetchLocations(); // Actualizar ubicaciones
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar sala');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar sala
  const deleteRoom = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      await roomService.deleteRoom(id);
      setRooms(prev => prev.filter(room => room.id !== id));
      await fetchLocations(); // Actualizar ubicaciones
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar sala');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Buscar salas por término
  const searchRooms = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      await fetchRooms(); // Recargar todas si la búsqueda está vacía
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const roomsData = await roomService.getRooms({ search: searchTerm });
      setRooms(roomsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar salas');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar salas por estado
  const filterByStatus = async (status: 'active' | 'maintenance' | 'inactive' | 'all') => {
    if (status === 'all') {
      await fetchRooms(); // Recargar todas si no hay filtro
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const roomsData = await roomService.getRooms({ status });
      setRooms(roomsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al filtrar salas');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar salas por tipo
  const filterByType = async (type: 'Estándar' | 'Premium' | 'VIP' | 'IMAX' | '4DX' | 'all') => {
    if (type === 'all') {
      await fetchRooms(); // Recargar todas si no hay filtro
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const roomsData = await roomService.getRooms({ type });
      setRooms(roomsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al filtrar por tipo');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar salas por ubicación
  const filterByLocation = async (location: 'Miraflores'| 'Antigua Telares'| 'Cayala'|'Oakland Mall' | 'all') => {
    if (location === 'all') {
      await fetchRooms(); // Recargar todas si no hay filtro
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const roomsData = await roomService.getRooms({ location });
      setRooms(roomsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al filtrar por ubicación');
    } finally {
      setLoading(false);
    }
  };

  // Obtener sala por ID (para detalles)
  const getRoomById = async (id: string): Promise<Room | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const room = await roomService.getRoomById(id);
      return room;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener la sala');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Cambiar estado de una sala rápidamente
  const toggleRoomStatus = async (id: string, newStatus: 'active' | 'maintenance' | 'inactive'): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      await roomService.updateRoom(id, { status: newStatus });
      await fetchRooms(); // Recargar la lista
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado de la sala');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial
  useEffect(() => {
    if (autoFetch) {
      fetchRooms(initialFilters);
      fetchLocations();
    }
  }, [autoFetch]);

  return {
    // ========== ESTADO ==========
    rooms,
    locations,
    loading,
    error,
    
    // ========== OPERACIONES CRUD ==========
    fetchRooms,
    createRoom,
    updateRoom,
    deleteRoom,
    getRoomById,
    
    // ========== OPERACIONES DE FILTRADO Y BÚSQUEDA ==========
    searchRooms,
    filterByStatus,
    filterByType,
    filterByLocation,
    toggleRoomStatus,
    
    // ========== UTILIDADES ==========
    refetch: () => fetchRooms(initialFilters),
    clearError: () => setError(null),
    reloadLocations: fetchLocations,
    
    // ========== LISTAS PREDEFINIDAS (desde el servicio) ==========
    roomTypes: roomService.getRoomTypes(),
    roomStatuses: roomService.getRoomStatuses(),
    roomLocations: roomService.getRoomLocations(),
    seatTypes: roomService.getSeatTypes(),
    
    // ========== INFORMACIÓN DEL ESTADO ==========
    hasRooms: rooms.length > 0,
    totalRooms: rooms.length,
    activeRoomsCount: rooms.filter(r => r.status === 'active').length,
    maintenanceRoomsCount: rooms.filter(r => r.status === 'maintenance').length,
    inactiveRoomsCount: rooms.filter(r => r.status === 'inactive').length,
    
    // Estadísticas por tipo
    standardRoomsCount: rooms.filter(r => r.type === 'Estándar').length,
    premiumRoomsCount: rooms.filter(r => r.type === 'Premium').length,
    vipRoomsCount: rooms.filter(r => r.type === 'VIP').length,
    imaxRoomsCount: rooms.filter(r => r.type === 'IMAX').length,
    fourDxRoomsCount: rooms.filter(r => r.type === '4DX').length,
    
    // Estadísticas por ubicación
    mirafloresCount: rooms.filter(r => r.location === 'Miraflores').length,
    antiguaTelaresCount: rooms.filter(r => r.location === 'Antigua Telares').length,
    cayalaCount: rooms.filter(r => r.location === 'Cayala').length,
    oaklandMallCount: rooms.filter(r => r.location === 'Oakland Mall').length,
    
    // Capacidad total
    totalCapacity: rooms.reduce((sum, room) => sum + room.capacity, 0),
    averageCapacity: rooms.length > 0 ? Math.round(rooms.reduce((sum, room) => sum + room.capacity, 0) / rooms.length) : 0,
  };
}

// Hook especializado para salas activas (para mostrar en la cartelera)
export function useActiveRooms() {
  return useRooms({
    autoFetch: true,
    initialFilters: { status: 'active' }
  });
}

// Hook especializado para administración (todas las salas)
export function useAllRooms() {
  return useRooms({
    autoFetch: true,
    initialFilters: {} // Sin filtros, carga todas
  });
}