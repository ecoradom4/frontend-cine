"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Monitor, Users, Clock, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { showtimesApi } from "@/services/showtimes-api"
import { Seat } from "@/types/seat"

interface SeatSelectionProps {
  showtimeId: string
  movieTitle: string
  showtimeLabel: string
  cinema: string
  // ✅ Actualizado para pasar también los precios
  onSeatsSelected: (seats: Seat[], total: number, ticketPrices?: {
    standard: number
    premium: number
    vip: number
  }) => void
}

export function SeatSelection({
  showtimeId,
  movieTitle,
  showtimeLabel,
  cinema,
  onSeatsSelected,
}: SeatSelectionProps) {
  const [seats, setSeats] = useState<Seat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [roomInfo, setRoomInfo] = useState<{ name: string; capacity: number } | null>(null)
  const [ticketPrices, setTicketPrices] = useState<{
    standard: number
    premium: number
    vip: number
  } | null>(null)

  // Función para calcular el total basado en precios reales
  const selectedSeats = seats.filter((seat) => seat.status === "selected")
  const totalPrice = selectedSeats.reduce((sum, seat) => {
    if (!ticketPrices) return sum
    return sum + ticketPrices[seat.type]
  }, 0)

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        setIsLoading(true)

        // 1️⃣ Obtener toda la función (incluye movie, room, seats y ticket_prices)
        const showtime = await showtimesApi.getShowtimeById(showtimeId)
        const apiSeats = showtime.seats || []
        const room = showtime.room

        // 2️⃣ Obtener precios reales del backend
        if (showtime.ticket_prices) {
          setTicketPrices({
            standard: parseFloat(showtime.ticket_prices.standard),
            premium: parseFloat(showtime.ticket_prices.premium),
            vip: parseFloat(showtime.ticket_prices.vip),
          })
        } else {
          // Fallback: usar precio base si no hay ticket_prices
          const basePrice = parseFloat(showtime.price)
          setTicketPrices({
            standard: basePrice,
            premium: basePrice * 1.1, // +10%
            vip: basePrice * 1.2,     // +20%
          })
        }

        // 3️⃣ Obtener asientos reservados del backend
        const reservedSeats = await showtimesApi.getReservedSeats(showtimeId)

        // 4️⃣ Normalizar estructura con reglas de disponibilidad
        const normalizedSeats: Seat[] = apiSeats.map((s: any) => {
          const isReserved = reservedSeats.some((r) => r.seat_id === s.id)
          return {
            id: s.id,
            row: s.row,
            number: s.number,
            type: s.type,
            status:
              s.status === "maintenance"
                ? "maintenance"
                : !s.is_available || isReserved
                ? "occupied"
                : "available",
          }
        })

        setSeats(normalizedSeats)
        setRoomInfo({ name: room.name, capacity: room.capacity })
      } catch (err) {
        console.error("Error al cargar asientos:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSeats()
  }, [showtimeId])

  const handleSeatClick = (seatId: string) => {
    setSeats((prevSeats) =>
      prevSeats.map((seat) => {
        if (seat.id === seatId) {
          if (seat.status === "occupied" || seat.status === "maintenance") return seat
          return {
            ...seat,
            status: seat.status === "selected" ? "available" : "selected",
          }
        }
        return seat
      })
    )
  }

  const getSeatColor = (seat: Seat) => {
    if (seat.status === "occupied") return "bg-destructive cursor-not-allowed"
    if (seat.status === "maintenance") return "bg-gray-400 cursor-not-allowed"
    if (seat.status === "selected") return "bg-primary hover:bg-primary/90"

    switch (seat.type) {
      case "vip":
        return "bg-chart-4 hover:bg-chart-4/90 text-white"
      case "premium":
        return "bg-chart-2 hover:bg-chart-2/90 text-white"
      default:
        return "bg-muted hover:bg-muted/80 text-foreground"
    }
  }

  // Función para obtener el precio de un asiento
  const getSeatPrice = (seatType: "standard" | "premium" | "vip"): string => {
    if (!ticketPrices) return "0.00"
    return ticketPrices[seatType].toFixed(2)
  }

  // ✅ Actualizado para pasar los precios al componente padre
  const handleContinue = () => {
    if (selectedSeats.length > 0 && ticketPrices) {
      onSeatsSelected(selectedSeats, totalPrice, ticketPrices)
    }
  }

  const rows = Array.from(new Set(seats.map((s) => s.row))).sort()

  return (
    <div className="space-y-6">
      {/* Movie Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            Selección de Asientos
          </CardTitle>
          <CardDescription>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="font-medium">{movieTitle}</span>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {showtimeLabel}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {cinema}
              </div>
            </div>
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Seat Map */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="text-center">
                <div className="bg-gradient-to-r from-muted to-muted-foreground/20 text-foreground py-2 px-8 rounded-lg inline-block mb-4 border">
                  PANTALLA
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center text-muted-foreground">Cargando asientos...</p>
              ) : seats.length === 0 ? (
                <p className="text-center text-muted-foreground">No hay asientos disponibles.</p>
              ) : (
                <div className="space-y-2">
                  {rows.map((row) => {
                    const rowSeats = seats
                      .filter((seat) => seat.row === row)
                      .sort((a, b) => a.number - b.number)

                    return (
                      <div key={row} className="flex items-center justify-center gap-1">
                        <div className="w-6 text-center text-sm font-medium text-muted-foreground">{row}</div>
                        <div className="flex gap-1">
                          {rowSeats.map((seat) => (
                            <button
                              key={seat.id}
                              onClick={() => handleSeatClick(seat.id)}
                              disabled={seat.status === "occupied" || seat.status === "maintenance"}
                              className={cn(
                                "w-8 h-8 rounded-t-lg text-xs font-medium transition-colors",
                                getSeatColor(seat)
                              )}
                              title={`${seat.row}${seat.number} - ${seat.type} - Q${getSeatPrice(seat.type)}`}
                            >
                              {seat.number}
                            </button>
                          ))}
                        </div>
                        <div className="w-6 text-center text-sm font-medium text-muted-foreground">{row}</div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Legend */}
              <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-muted rounded-t-lg border" />
                  <span>
                    Estándar {ticketPrices ? `(Q${getSeatPrice("standard")})` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-chart-2 rounded-t-lg" />
                  <span>
                    Premium {ticketPrices ? `(Q${getSeatPrice("premium")})` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-chart-4 rounded-t-lg" />
                  <span>
                    VIP {ticketPrices ? `(Q${getSeatPrice("vip")})` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-primary rounded-t-lg" />
                  <span>Seleccionado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-destructive rounded-t-lg" />
                  <span>Ocupado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-400 rounded-t-lg" />
                  <span>Mantenimiento</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Resumen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Asientos seleccionados:</h4>
                {selectedSeats.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Ningún asiento seleccionado</p>
                ) : (
                  <div className="space-y-1">
                    {selectedSeats.map((seat) => (
                      <div key={seat.id} className="flex justify-between text-sm">
                        <span>
                          {seat.row}
                          {seat.number} ({seat.type})
                        </span>
                        <span>
                          {ticketPrices ? `Q${getSeatPrice(seat.type)}` : "Cargando..."}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedSeats.length > 0 && ticketPrices && (
                <>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span className="text-primary">Q{totalPrice.toFixed(2)}</span>
                  </div>
                  <Button onClick={handleContinue} className="w-full" size="lg">
                    Continuar al Pago
                  </Button>
                </>
              )}

              {selectedSeats.length === 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  Selecciona al menos un asiento para continuar
                </p>
              )}

              {selectedSeats.length > 0 && !ticketPrices && (
                <p className="text-xs text-muted-foreground text-center">
                  Cargando precios...
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}