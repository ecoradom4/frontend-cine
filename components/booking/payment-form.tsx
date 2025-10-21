"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { bookingsApi, type BookingPayload } from "@/services/bookings-api"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Lock, ArrowLeft, Calendar, MapPin, Clock } from "lucide-react"
import { Seat } from "@/types/seat"

interface PaymentFormProps {
  movieTitle: string
  showtime: string
  cinema: string
  selectedSeats: Seat[]
  totalPrice: number
  onPaymentComplete: (paymentData: any) => void
  onBack: () => void
  showtimeId: string
  // ✅ Hacer opcional
  ticketPrices?: {
    standard: number
    premium: number
    vip: number
  }
}

// ✅ Función helper para asegurar el tipo de asiento
const ensureSeatType = (type: string): "standard" | "premium" | "vip" => {
  if (type === "standard" || type === "premium" || type === "vip") {
    return type
  }
  // Log para debugging
  console.warn(`Tipo de asiento inválido: ${type}, usando "standard" como fallback`)
  return "standard"
}

export function PaymentForm({
  movieTitle,
  showtime,
  cinema,
  selectedSeats,
  totalPrice,
  onPaymentComplete,
  onBack,
  showtimeId,
  ticketPrices, // ✅ Ahora es opcional
}: PaymentFormProps) {
  const { user } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardName: "",
    email: user?.email || "",
  })

  const fees = totalPrice * 0.05
  const finalTotal = totalPrice + fees

  // 🔹 Función para obtener precio de asiento
  const getSeatPrice = (seatType: "standard" | "premium" | "vip"): number => {
    if (!ticketPrices) {
      // Fallback inteligente basado en el total
      const averagePrice = selectedSeats.length > 0 ? totalPrice / selectedSeats.length : 12.5
      const defaultPrices = {
        standard: averagePrice,
        premium: averagePrice * 1.1,
        vip: averagePrice * 1.2,
      }
      return defaultPrices[seatType]
    }
    return ticketPrices[seatType]
  }

  // 🔹 Formatear número de tarjeta
  const formatCardNumber = (value: string) =>
    value
      .replace(/\s+/g, "")
      .replace(/[^\d]/g, "")
      .slice(0, 16)
      .replace(/(\d{4})(?=\d)/g, "$1 ")

  // 🔹 Formatear fecha de vencimiento
  const formatExpiryDate = (value: string) => {
    const numbersOnly = value.replace(/[^\d]/g, "").slice(0, 4)
    return numbersOnly.length > 2 ? `${numbersOnly.slice(0, 2)}/${numbersOnly.slice(2)}` : numbersOnly
  }

  // 🔹 Validaciones básicas
  const validateForm = () => {
    const number = formData.cardNumber.replace(/\s+/g, "")
    if (!/^\d{16}$/.test(number)) return "El número de tarjeta debe tener 16 dígitos."
    if (!/^\d{2}\/\d{2}$/.test(formData.expiryDate)) return "El formato de vencimiento debe ser MM/AA."
    const [mm, yy] = formData.expiryDate.split("/").map(Number)
    const currentYear = new Date().getFullYear() % 100
    const currentMonth = new Date().getMonth() + 1
    if (mm < 1 || mm > 12) return "Mes de vencimiento inválido."
    if (yy < currentYear || (yy === currentYear && mm < currentMonth))
      return "La tarjeta está vencida."
    if (!/^\d{3,4}$/.test(formData.cvv)) return "El CVV debe tener 3 o 4 dígitos."
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      return "El correo electrónico no es válido."
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const validationError = validateForm()
    if (validationError) return setErrorMessage(validationError)

    setIsProcessing(true)
    try {
      const email = formData.email.trim() || user?.email?.trim() || ""

      const payload: BookingPayload = {
        showtime_id: showtimeId,
        seat_ids: selectedSeats.map((s) => s.id),
        payment_method: "Tarjeta de Crédito",
        customer_email: email,
      }

      // ✅ Crear la reserva real
      const response = await bookingsApi.createBooking(payload)
      const booking = response.data.booking

      // ✅ Construir el objeto de pago coherente con backend
      const paymentData = {
        bookingId: booking.id, // para el recibo
        transactionId: booking.transaction_id,
        movieTitle: booking.showtime.movie.title,
        showtime: `${booking.showtime.date} ${booking.showtime.time}`,
        cinema: booking.showtime.room.name,
        seats: booking.bookingSeats.map((bs) => {
          // ✅ Usar la función helper para asegurar el tipo correcto
          const seatType = ensureSeatType(bs.seat.type)
          return {
            id: bs.seat.id,
            row: bs.seat.row,
            number: bs.seat.number,
            type: seatType,
            price: getSeatPrice(seatType), // ✅ Incluir precio individual
          }
        }),
        totalPrice: parseFloat(booking.total_price),
        payment_method: booking.payment_method,
        customer_email: booking.customer_email,
        purchaseDate: booking.purchase_date,
        ticketPrices: ticketPrices, // ✅ Incluir estructura de precios
      }

      onPaymentComplete(paymentData)
    } catch (err: any) {
      console.error("Error al procesar la reserva:", err)
      setErrorMessage("Ocurrió un error al procesar el pago. Inténtalo nuevamente.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack} disabled={isProcessing}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Finalizar Compra</h1>
          <p className="text-muted-foreground">Completa tu información de pago</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario de pago */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
              <CardDescription>Necesaria para enviar tu comprobante</CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="tu@email.com"
                disabled={isProcessing}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Información de Pago
              </CardTitle>
              <CardDescription>Tus datos están protegidos con encriptación SSL</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                <div className="space-y-2">
                  <Label htmlFor="cardName">Nombre en la tarjeta</Label>
                  <Input
                    id="cardName"
                    value={formData.cardName}
                    onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
                    placeholder="Juan Pérez"
                    required
                    disabled={isProcessing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Número de tarjeta</Label>
                  <Input
                    id="cardNumber"
                    value={formData.cardNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, cardNumber: formatCardNumber(e.target.value) })
                    }
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    required
                    disabled={isProcessing}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Fecha de vencimiento</Label>
                    <Input
                      id="expiryDate"
                      value={formData.expiryDate}
                      onChange={(e) =>
                        setFormData({ ...formData, expiryDate: formatExpiryDate(e.target.value) })
                      }
                      placeholder="MM/AA"
                      maxLength={5}
                      required
                      disabled={isProcessing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      value={formData.cvv}
                      onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                      placeholder="123"
                      maxLength={4}
                      required
                      disabled={isProcessing}
                    />
                  </div>
                </div>

                {errorMessage && <p className="text-sm text-red-600 mt-2">{errorMessage}</p>}

                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
                  <Lock className="h-4 w-4" />
                  <span>Tu información está segura y encriptada</span>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isProcessing}>
                  {isProcessing
                    ? "Procesando pago..."
                    : `Confirmar y pagar Q${finalTotal.toFixed(2)}`}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Resumen de compra */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Resumen de Compra</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">{movieTitle}</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {showtime}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {cinema}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Asientos:</h4>
                <div className="space-y-1">
                  {selectedSeats.map((seat) => (
                    <div key={seat.id} className="flex justify-between text-sm">
                      <span>
                        {seat.row}
                        {seat.number}{" "}
                        <Badge variant="outline" className="ml-1 capitalize">
                          {seat.type}
                        </Badge>
                      </span>
                      <span>
                        Q{getSeatPrice(seat.type).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>Q{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Cargos por servicio:</span>
                  <span>Q{fees.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium text-lg">
                  <span>Total:</span>
                  <span className="text-primary">Q{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* ✅ Mostrar precios de referencia si están disponibles */}
              {ticketPrices && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Precios aplicados:</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-medium">Estándar</div>
                      <div>Q{ticketPrices.standard.toFixed(2)}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">Premium</div>
                      <div>Q{ticketPrices.premium.toFixed(2)}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">VIP</div>
                      <div>Q{ticketPrices.vip.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}