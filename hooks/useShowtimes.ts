// src/hooks/useShowtimes.ts
"use client"

import { useEffect, useState, useCallback } from "react" 
import {
  adminShowtimesService,
  Showtime,
  ShowtimeInput,
  ScheduleShowtimesPayload,
  ScheduleShowtimesResponse,
} from "@/services/admin-showtimes-api"

interface UseShowtimesOptions {
  movieId?: string
  roomId?: string
  date?: string
  autoFetch?: boolean
}

// Función helper para parsear precios
const parsePrice = (price: any): number => {
  if (typeof price === 'number') return price
  if (typeof price === 'string') return parseFloat(price) || 0
  return 0
}

export function useShowtimes(options: UseShowtimesOptions = { autoFetch: true }) {
  const [showtimes, setShowtimes] = useState<Showtime[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchShowtimes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params: any = {}
      if (options.movieId) params.movieId = options.movieId
      if (options.roomId) params.roomId = options.roomId
      if (options.date) params.date = options.date

      const data = await adminShowtimesService.getShowtimes(params)
      
      // Parsear precios y asegurar que sean números
      const parsedShowtimes = data.map((showtime: Showtime) => ({
        ...showtime,
        price: parsePrice(showtime.price),
        available_seats: typeof showtime.available_seats === 'string' ? 
          parseInt(showtime.available_seats) : showtime.available_seats,
        total_seats: typeof showtime.total_seats === 'string' ? 
          parseInt(showtime.total_seats) : showtime.total_seats,
      }))
      
      setShowtimes(parsedShowtimes)
    } catch (err: any) {
      setError(err.message || "Error al cargar funciones")
      console.error("Error fetching showtimes:", err)
    } finally {
      setLoading(false)
    }
  }, [options.movieId, options.roomId, options.date])

  useEffect(() => {
    if (options.autoFetch) {
      fetchShowtimes()
    }
  }, [fetchShowtimes, options.autoFetch])

  const createShowtime = async (showtimeData: ShowtimeInput): Promise<Showtime> => {
    try {
      setLoading(true)
      setError(null)
      const newShowtime = await adminShowtimesService.createShowtime(showtimeData)
      
      // Parsear el precio del nuevo showtime
      const parsedShowtime = {
        ...newShowtime,
        price: parsePrice(newShowtime.price)
      }
      
      // Actualizar la lista automáticamente recargando todo
      await fetchShowtimes()
      return parsedShowtime
    } catch (err: any) {
      setError(err.message || "Error al crear función")
      console.error("Error creating showtime:", err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateShowtime = async (id: string, updateData: Partial<ShowtimeInput>): Promise<Showtime> => {
    try {
      setLoading(true)
      setError(null)
      const updated = await adminShowtimesService.updateShowtime(id, updateData)
      
      // Parsear el precio del showtime actualizado
      const parsedShowtime = {
        ...updated,
        price: parsePrice(updated.price)
      }
      
      // Actualizar la lista automáticamente recargando todo
      await fetchShowtimes()
      return parsedShowtime
    } catch (err: any) {
      setError(err.message || "Error al actualizar función")
      console.error("Error updating showtime:", err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteShowtime = async (id: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      await adminShowtimesService.deleteShowtime(id)
      
      // Actualizar la lista automáticamente recargando todo
      await fetchShowtimes()
    } catch (err: any) {
      setError(err.message || "Error al eliminar función")
      console.error("Error deleting showtime:", err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const scheduleShowtimes = async (
    payload: ScheduleShowtimesPayload
  ): Promise<ScheduleShowtimesResponse> => {
    try {
      setLoading(true)
      setError(null)
      const response = await adminShowtimesService.scheduleShowtimes(payload)
      
      // Parsear precios de las funciones creadas
      if (response.data?.created) {
        response.data.created = response.data.created.map(showtime => ({
          ...showtime,
          price: parsePrice(showtime.price)
        }))
      }
      
      // Actualizar la lista automáticamente recargando todo
      await fetchShowtimes()
      
      return response
    } catch (err: any) {
      setError(err.message || "Error al programar funciones")
      console.error("Error scheduling showtimes:", err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getAvailableSeats = async (showtimeId: string) => {
    try {
      setLoading(true)
      setError(null)
      return await adminShowtimesService.getAvailableSeats(showtimeId)
    } catch (err: any) {
      setError(err.message || "Error al obtener asientos")
      console.error("Error fetching seats:", err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Función para limpiar errores manualmente
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    showtimes,
    loading,
    error,
    createShowtime,
    updateShowtime,
    deleteShowtime,
    scheduleShowtimes,
    getAvailableSeats,
    refreshShowtimes: fetchShowtimes,
    clearError, // Nueva función para limpiar errores
  }
}

// Hook para una sola función
export function useShowtime(showtimeId?: string) {
  const [showtime, setShowtime] = useState<Showtime | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchShowtime = useCallback(async (id: string) => {
    if (!id) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await adminShowtimesService.getShowtimeById(id)
      
      // Parsear el precio
      const parsedShowtime = {
        ...data,
        price: parsePrice(data.price)
      }
      
      setShowtime(parsedShowtime)
    } catch (err: any) {
      setError(err.message || "Error al cargar la función")
      console.error("Error fetching showtime:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  useEffect(() => {
    if (showtimeId) {
      fetchShowtime(showtimeId)
    }
  }, [showtimeId, fetchShowtime])

  return {
    showtime,
    loading,
    error,
    refetch: fetchShowtime,
    clearError, // Nueva función para limpiar errores
  }
}