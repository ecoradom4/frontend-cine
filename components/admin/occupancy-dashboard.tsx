"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Users, TrendingUp } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useState } from "react"

// Mock data for occupancy
const roomOccupancy = [
  { id: "sala-1", name: "Sala 1", capacity: 150, occupied: 142, percentage: 95, status: "full" },
  { id: "sala-2", name: "Sala 2", capacity: 120, occupied: 96, percentage: 80, status: "high" },
  { id: "sala-3", name: "Sala 3", capacity: 100, occupied: 45, percentage: 45, status: "medium" },
  { id: "sala-4", name: "Sala 4", capacity: 180, occupied: 36, percentage: 20, status: "low" },
  { id: "sala-5", name: "Sala 5", capacity: 200, occupied: 160, percentage: 80, status: "high" },
  { id: "sala-6", name: "Sala 6", capacity: 90, occupied: 18, percentage: 20, status: "low" },
]

const occupancyTrends = [
  { hora: "14:00", ocupacion: 45 },
  { hora: "15:00", ocupacion: 62 },
  { hora: "16:00", ocupacion: 78 },
  { hora: "17:00", ocupacion: 85 },
  { hora: "18:00", ocupacion: 92 },
  { hora: "19:00", ocupacion: 88 },
  { hora: "20:00", ocupacion: 95 },
  { hora: "21:00", ocupacion: 89 },
  { hora: "22:00", ocupacion: 76 },
]

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

export function OccupancyDashboard() {
  const [selectedCinema, setSelectedCinema] = useState("centro")

  const totalCapacity = roomOccupancy.reduce((sum, room) => sum + room.capacity, 0)
  const totalOccupied = roomOccupancy.reduce((sum, room) => sum + room.occupied, 0)
  const averageOccupancy = Math.round((totalOccupied / totalCapacity) * 100)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard de Ocupación</h1>
          <p className="text-muted-foreground">Monitoreo en tiempo real de salas</p>
        </div>
        <Select value={selectedCinema} onValueChange={setSelectedCinema}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="centro">Cine Connect Centro</SelectItem>
            <SelectItem value="norte">Cine Connect Norte</SelectItem>
            <SelectItem value="sur">Cine Connect Sur</SelectItem>
            <SelectItem value="plaza">Cine Connect Plaza</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ocupación Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{averageOccupancy}%</div>
            <Progress value={averageOccupancy} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asientos Ocupados</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {totalOccupied}/{totalCapacity}
            </div>
            <p className="text-xs text-muted-foreground">Total de asientos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Salas Activas</CardTitle>
            <MapPin className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{roomOccupancy.length}</div>
            <p className="text-xs text-muted-foreground">En funcionamiento</p>
          </CardContent>
        </Card>
      </div>

      {/* Room Occupancy Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Mapa de Ocupación por Sala</CardTitle>
          <CardDescription>Estado actual de todas las salas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roomOccupancy.map((room) => (
              <Card key={room.id} className="relative overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{room.name}</CardTitle>
                    <Badge variant="outline" className={`${getStatusColor(room.status)} text-white border-none`}>
                      {getStatusLabel(room.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Ocupación:</span>
                      <span className="font-semibold">
                        {room.occupied}/{room.capacity}
                      </span>
                    </div>
                    <Progress value={room.percentage} className="h-2" />
                    <div className="text-center">
                      <span className="text-2xl font-bold text-primary">{room.percentage}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Occupancy Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Tendencia de Ocupación</CardTitle>
          <CardDescription>Ocupación promedio por horario</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={occupancyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hora" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value) => [`${value}%`, "Ocupación"]}
              />
              <Area
                type="monotone"
                dataKey="ocupacion"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
