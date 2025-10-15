"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, MapPin, User, Download, Star, Film } from "lucide-react"
import { useRouter } from "next/navigation" // ✅ usamos useRouter en lugar de redirect
import { bookingsUserApi, type UserBooking } from "@/services/bookings-user-api"

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter() // ✅ Hook para navegación en cliente
  const [bookings, setBookings] = useState<UserBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  
  useEffect(() => {
    if (!user) {
      router.push("/auth")
    }
  }, [user, router])

  useEffect(() => {
    const loadBookings = async () => {
      try {
        setLoading(true)
        const data = await bookingsUserApi.getUserBookings()
        setBookings(data)
      } catch (err: any) {
        setError(err.message || "Error al cargar reservas.")
      } finally {
        setLoading(false)
      }
    }

    loadBookings()
  }, [])

  // 🔹 Clasificación de estados según fecha
  const now = new Date()
  const parseDateTime = (b: UserBooking) => new Date(`${b.showtime.date}T${b.showtime.time}`)

  const getComputedStatus = (b: UserBooking) => {
    if (b.status === "cancelada") return "cancelada"
    const showtimeDate = parseDateTime(b)
    return showtimeDate < now ? "completada" : "confirmada"
  }

  // 🔹 Colores dinámicos
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmada":
        return "bg-green-500"
      case "completada":
        return "bg-blue-500"
      case "cancelada":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmada":
        return "Confirmada"
      case "completada":
        return "Completada"
      case "cancelada":
        return "Cancelada"
      default:
        return "Desconocido"
    }
  }

  // 🔹 Filtros y ordenamiento
  const confirmed = bookings
    .filter((b) => getComputedStatus(b) === "confirmada")
    .sort((a, b) => parseDateTime(a).getTime() - parseDateTime(b).getTime()) // ascendente

  const completed = bookings
    .filter((b) => getComputedStatus(b) === "completada")
    .sort((a, b) => parseDateTime(b).getTime() - parseDateTime(a).getTime()) // descendente

  const canceled = bookings
    .filter((b) => getComputedStatus(b) === "cancelada")
    .sort((a, b) => parseDateTime(b).getTime() - parseDateTime(a).getTime()) // descendente

  const all = [...bookings].sort(
    (a, b) => parseDateTime(b).getTime() - parseDateTime(a).getTime()
  ) // descendente por defecto

  const totalSpent = bookings.reduce((sum, b) => sum + parseFloat(b.total_price), 0)
  const totalMovies = bookings.length

  const renderBookingCard = (b: UserBooking) => {
    const status = getComputedStatus(b)
    return (
      <Card key={b.id} className="border-l-4 border-l-primary hover:shadow-md transition-all">
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 🎬 Poster */}
            {b.showtime.movie.poster && (
              <img
                src={b.showtime.movie.poster}
                alt={b.showtime.movie.title}
                className="w-24 h-32 object-cover rounded-md shadow"
              />
            )}

            {/* 🧾 Información principal */}
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Film className="h-4 w-4 text-primary" />
                    {b.showtime.movie.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">ID: {b.transaction_id}</p>
                </div>
                <Badge className={`${getStatusColor(status)} text-white`}>
                  {getStatusLabel(status)}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {b.showtime.time}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {b.showtime.room.name}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {b.showtime.date}
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {b.bookingSeats.map((s) => `${s.seat.row}${s.seat.number}`).join(", ")}
                </div>
              </div>

              <Separator className="my-3" />

              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-primary">
                  Q{parseFloat(b.total_price).toFixed(2)}
                </span>
                {b.receipt_url && (
                  <Button asChild size="sm" variant="outline">
                    <a href={b.receipt_url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Recibo
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* 👤 Encabezado de perfil */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <h1 className="text-2xl font-bold">{user?.name}</h1>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 📊 Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" /> Películas vistas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalMovies}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Total gastado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Q{totalSpent.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" /> Promedio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  Q{totalMovies > 0 ? (totalSpent / totalMovies).toFixed(2) : "0.00"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 🧭 Tabs */}
          <Tabs defaultValue="confirmadas" className="space-y-4">
            <TabsList>
              <TabsTrigger value="confirmadas">Confirmadas</TabsTrigger>
              <TabsTrigger value="completadas">Completadas</TabsTrigger>
              <TabsTrigger value="canceladas">Canceladas</TabsTrigger>
              <TabsTrigger value="historial">Historial</TabsTrigger>
            </TabsList>

            <TabsContent value="confirmadas">
              <Card>
                <CardHeader>
                  <CardTitle>Reservas Confirmadas</CardTitle>
                  <CardDescription>Funciones próximas a realizarse</CardDescription>
                </CardHeader>
                <CardContent>
                  {confirmed.length ? (
                    <div className="space-y-4">{confirmed.map(renderBookingCard)}</div>
                  ) : (
                    <p className="text-center text-muted-foreground">No tienes reservas confirmadas.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="completadas">
              <Card>
                <CardHeader>
                  <CardTitle>Funciones Completadas</CardTitle>
                  <CardDescription>Reservas de funciones ya realizadas</CardDescription>
                </CardHeader>
                <CardContent>
                  {completed.length ? (
                    <div className="space-y-4">{completed.map(renderBookingCard)}</div>
                  ) : (
                    <p className="text-center text-muted-foreground">No tienes funciones completadas.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="canceladas">
              <Card>
                <CardHeader>
                  <CardTitle>Reservas Canceladas</CardTitle>
                  <CardDescription>Reservas que fueron anuladas</CardDescription>
                </CardHeader>
                <CardContent>
                  {canceled.length ? (
                    <div className="space-y-4">{canceled.map(renderBookingCard)}</div>
                  ) : (
                    <p className="text-center text-muted-foreground">No tienes reservas canceladas.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="historial">
              <Card>
                <CardHeader>
                  <CardTitle>Historial Completo</CardTitle>
                  <CardDescription>Todas tus reservas registradas</CardDescription>
                </CardHeader>
                <CardContent>
                  {all.length ? (
                    <div className="space-y-4">{all.map(renderBookingCard)}</div>
                  ) : (
                    <p className="text-center text-muted-foreground">No tienes reservas registradas.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
