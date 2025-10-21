"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Users, TrendingUp, Calendar, Clock, Building } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useState, useEffect } from "react"
import { dashboardApi, type RoomOccupancyResponse, type LocationsResponse } from "@/services/dashboard-api"

const getStatusColor = (status: string) => {
  switch (status) {
    case "full":
      return "bg-destructive"
    case "high":
      return "bg-chart-4"
    case "medium":
      return "bg-chart-2"
    case "low":
      return "bg-chart-5"
    default:
      return "bg-muted"
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case "full":
      return "Lleno"
    case "high":
      return "Alta"
    case "medium":
      return "Media"
    case "low":
      return "Baja"
    default:
      return "Desconocido"
  }
}

// Versión MEJORADA con más análisis
const generateTrendsFromShowtimes = (roomOccupancy: any[]) => {
  const allShowtimes = roomOccupancy.flatMap(room => room.showtimes || [])

  if (allShowtimes.length === 0) {
    return []
  }

  // Agrupar por hora y calcular métricas
  const trendsByHour: {
    [key: string]: {
      percentages: number[]
      totalShowtimes: number
      totalRevenue: number
    }
  } = {}

  allShowtimes.forEach(showtime => {
    const hour = showtime.time.substring(0, 5)
    if (!trendsByHour[hour]) {
      trendsByHour[hour] = {
        percentages: [],
        totalShowtimes: 0,
        totalRevenue: 0
      }
    }
    trendsByHour[hour].percentages.push(showtime.occupancyPercentage)
    trendsByHour[hour].totalShowtimes++
    trendsByHour[hour].totalRevenue += showtime.revenue || 0
  })

  // Calcular métricas para el gráfico
  const trends = Object.entries(trendsByHour)
    .map(([hora, data]) => ({
      hora,
      ocupacion: parseFloat((data.percentages.reduce((sum, p) => sum + p, 0) / data.percentages.length).toFixed(1)),
      totalFunciones: data.totalShowtimes,
      ingresos: parseFloat(data.totalRevenue.toFixed(2))
    }))
    .sort((a, b) => a.hora.localeCompare(b.hora))

  return trends
}

export function OccupancyDashboard() {
  const [selectedLocation, setSelectedLocation] = useState<string>("all")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("day")
  const [occupancyData, setOccupancyData] = useState<RoomOccupancyResponse | null>(null)
  const [locations, setLocations] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar ubicaciones disponibles
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const locationsResponse = await dashboardApi.getAvailableLocations()
        setLocations(locationsResponse.locations)
      } catch (err) {
        console.error('Error cargando ubicaciones:', err)
        setError('No se pudieron cargar las ubicaciones')
      }
    }
    loadLocations()
  }, [])

  // Cargar datos de ocupación cuando cambien los filtros
  useEffect(() => {
    const loadOccupancyData = async () => {
      setLoading(true)
      setError(null)

      try {
        const params: any = { period: selectedPeriod }

        // Solo enviar location si no es "all"
        if (selectedLocation && selectedLocation !== "all") {
          params.location = selectedLocation
        }

        const data = await dashboardApi.getRoomOccupancy(params)
        setOccupancyData(data)
      } catch (err) {
        console.error('Error cargando datos de ocupación:', err)
        setError('No se pudieron cargar los datos de ocupación')
      } finally {
        setLoading(false)
      }
    }

    loadOccupancyData()
  }, [selectedLocation, selectedPeriod])

  // Datos para las tarjetas de resumen
  const summaryData = occupancyData?.summary || {
    totalRooms: 0,
    roomsWithShowtimes: 0,
    totalShowtimes: 0,
    overallAvgOccupancy: 0,
    totalRevenue: 0,
    totalOccupiedSeats: 0
  }

  const totalCapacity = occupancyData?.roomOccupancy.reduce((sum, room) => sum + room.capacity, 0) || 0

  // Generar tendencias desde los datos reales
  const occupancyTrends = occupancyData ?
    generateTrendsFromShowtimes(occupancyData.roomOccupancy) : []

  // Obtener el título de ubicación para mostrar
  const getLocationTitle = () => {
    if (selectedLocation === "all") {
      return "Todas las ubicaciones"
    }
    return selectedLocation
  }

  // Agrupar salas por ubicación para mejor organización
  const roomsByLocation = occupancyData?.roomOccupancy.reduce((acc, room) => {
    if (!acc[room.location]) {
      acc[room.location] = []
    }
    acc[room.location].push(room)
    return acc
  }, {} as { [key: string]: any[] }) || {}

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard de Ocupación</h1>
            <p className="text-muted-foreground">Cargando datos...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-2 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard de Ocupación</h1>
            <p className="text-muted-foreground text-destructive">{error}</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              {error}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard de Ocupación</h1>
          <p className="text-muted-foreground">
            {occupancyData?.filterApplied.dateRange?.label || 'Monitoreo en tiempo real de salas'} • {getLocationTitle()}
          </p>
        </div>
        <div className="flex gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Hoy</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="year">Este año</SelectItem>
              <SelectItem value="future">Futuro</SelectItem>
              <SelectItem value="past">Pasado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-48">
              {selectedLocation === "all" ? (
                <Building className="h-4 w-4 mr-2" />
              ) : (
                <MapPin className="h-4 w-4 mr-2" />
              )}
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  Todas las ubicaciones
                </div>
              </SelectItem>
              {locations.map(location => (
                <SelectItem key={location} value={location}>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {location}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ocupación Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{summaryData.overallAvgOccupancy}%</div>
            <Progress value={summaryData.overallAvgOccupancy} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {summaryData.roomsWithShowtimes} salas con funciones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asientos Ocupados</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {summaryData.totalOccupiedSeats}/{totalCapacity}
            </div>
            <p className="text-xs text-muted-foreground">
              {summaryData.totalShowtimes} funciones totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <MapPin className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              Q{summaryData.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {summaryData.totalRooms} salas en {selectedLocation === "all" ? "todas las ubicaciones" : selectedLocation}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Room Occupancy Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Mapa de Ocupación por Sala</CardTitle>
          <CardDescription>
            Estado de ocupación basado en reservas confirmadas - {getLocationTitle()}
            {selectedLocation === "all" && ` (${Object.keys(roomsByLocation).length} ubicaciones)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {occupancyData?.roomOccupancy.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay datos de ocupación para los filtros seleccionados
            </div>
          ) : (
            <div className="space-y-6">
              {/* Si estamos viendo todas las ubicaciones, agrupar por ubicación */}
              {selectedLocation === "all" ? (
                Object.entries(roomsByLocation).map(([location, rooms]) => (
                  <div key={location} className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">{location}</h3>
                      <Badge variant="outline" className="ml-2">
                        {rooms.length} salas
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {rooms.map((room) => (
                        <RoomCard key={room.id} room={room} />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                // Si estamos viendo una ubicación específica, mostrar todas las salas juntas
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {occupancyData?.roomOccupancy.map((room) => (
                    <RoomCard key={room.id} room={room} />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Occupancy Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Tendencia de Ocupación por Horario</CardTitle>
          <CardDescription>
            Ocupación promedio por horario basada en {occupancyTrends.length} funciones programadas - {getLocationTitle()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {occupancyTrends.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No hay datos de tendencias</h3>
                <p className="text-sm max-w-md mx-auto">
                  No se encontraron funciones programadas para el período seleccionado.
                  Intenta con otro rango de tiempo o ubicación.
                </p>
              </div>
              <div className="flex justify-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {selectedPeriod}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {getLocationTitle()}
                </Badge>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={occupancyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="hora"
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Horario', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  domain={[0, 100]}
                  label={{ value: 'Ocupación %', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value, name) => {
                    if (name === "ocupacion") return [`${value}%`, "Ocupación Promedio"]
                    if (name === "totalFunciones") return [value, "Total de Funciones"]
                    if (name === "ingresos") return [`Q${value.toLocaleString()}`, "Ingresos"]
                    return [value, name]
                  }}
                  labelFormatter={(label) => `Horario: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="ocupacion"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                  strokeWidth={2}
                  name="Ocupación"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Componente separado para la tarjeta de sala
function RoomCard({ room }: { room: any }) {
  return (
    <Card key={room.id} className="relative overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{room.name}</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              {room.type}
            </Badge>
            <Badge variant="outline" className={`${getStatusColor(room.occupancyStatus)} text-white border-none`}>
              {getStatusLabel(room.occupancyStatus)}
            </Badge>
          </div>
        </div>
        <CardDescription className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {room.totalShowtimes} funciones
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Ocupación promedio:</span>
            <span className="font-semibold">{room.avgOccupancy}%</span>
          </div>
          <Progress value={room.avgOccupancy} className="h-2" />

          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>Máxima: {room.maxOccupancy}%</div>
            <div>Mínima: {room.minOccupancy}%</div>
          </div>

          <div className="flex justify-between text-sm">
            <span>Ingresos:</span>
            <span className="font-semibold">Q{room.totalRevenue.toLocaleString()}</span>
          </div>

          {room.showtimes.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <div className="text-xs font-medium mb-2">Próximas funciones:</div>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {room.showtimes.slice(0, 3).map((showtime: any) => (
                  <div key={showtime.showtimeId} className="flex justify-between text-xs">
                    <span>{showtime.time}</span>
                    <Badge variant="outline" className={`${getStatusColor(showtime.occupancyStatus)} text-white border-none text-xs`}>
                      {showtime.occupancyPercentage}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}