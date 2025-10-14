"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  CheckCircle,
  Download,
  Calendar,
  MapPin,
  Clock,
  CreditCard,
  Mail,
  ClipboardList,
} from "lucide-react"
import Link from "next/link"
import { bookingsReceiptApi } from "@/services/bookings-receipt-api"

interface BookingConfirmationProps {
  paymentData: {
    bookingId: string
    transactionId: string
    movieTitle: string
    showtime: string
    cinema: string
    seats: Array<{
      id: string
      row: string
      number: number
      type: string
    }>
    totalPrice: number
    payment_method?: string
    customer_email?: string
    purchaseDate: string
  }
}

export function BookingConfirmation({ paymentData }: BookingConfirmationProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownloadTicket = async () => {
    try {
      setIsDownloading(true)
      setError(null)

      // ✅ Ahora usamos el ID de reserva real
      await bookingsReceiptApi.downloadReceipt(paymentData.bookingId)
    } catch (err: any) {
      console.error("Error al descargar el recibo:", err)
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Ocurrió un error al descargar tu recibo. Inténtalo nuevamente."
      setError(msg)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* ✅ Mensaje de éxito */}
      <Card className="text-center">
        <CardContent className="pt-6">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">¡Compra Exitosa!</h1>
          <p className="text-muted-foreground">
            Tu reserva ha sido confirmada. Recibirás un correo con el comprobante en breve.
          </p>
        </CardContent>
      </Card>

      {/* 🎟️ Detalles del boleto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Detalles del Boleto
          </CardTitle>
          <CardDescription>
            <div className="flex flex-col sm:flex-row gap-1 text-sm">
              <span>
                <strong>ID de Reserva:</strong> {paymentData.bookingId}
              </span>
              <span className="hidden sm:inline mx-2 text-muted-foreground">•</span>
              <span>
                <strong>ID de Transacción:</strong> {paymentData.transactionId}
              </span>
            </div>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 🎬 Información de la película */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{paymentData.movieTitle}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{paymentData.showtime}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{paymentData.cinema}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(paymentData.purchaseDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* 💺 Asientos */}
          <div>
            <h4 className="font-medium mb-2">Asientos Reservados:</h4>
            <div className="flex flex-wrap gap-2">
              {paymentData.seats?.length ? (
                paymentData.seats.map((seat) => (
                  <Badge key={seat.id} variant="outline" className="text-sm">
                    Fila {seat.row} — Asiento {seat.number} ({seat.type})
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No se encontraron asientos reservados.
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* 💳 Información de pago */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Método de Pago:</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span>{paymentData.payment_method || "Tarjeta de Crédito"}</span>
                </div>
                <p className="text-muted-foreground font-medium">
                  Total Pagado: Q{paymentData.totalPrice.toFixed(2)}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Correo de Confirmación:</h4>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{paymentData.customer_email}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 📥 Acciones */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={handleDownloadTicket} className="flex-1" disabled={isDownloading}>
          <Download className="h-4 w-4 mr-2" />
          {isDownloading ? "Descargando..." : "Descargar Recibo"}
        </Button>
      </div>

      {isDownloading && (
        <p className="text-center text-sm text-muted-foreground">Preparando tu recibo...</p>
      )}

      {error && <p className="text-center text-sm text-red-600">{error}</p>}

      {/* ℹ️ Información Importante */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            Información Importante
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Llega al cine al menos 15 minutos antes de la función.</p>
          <p>• Presenta tu boleto digital o impreso en la entrada.</p>
          <p>• Los boletos no son reembolsables ni transferibles.</p>
        </CardContent>
      </Card>

      {/* 🔁 Navegación */}
      <div className="text-center space-y-4">
        <Button asChild variant="outline">
          <Link href="/cartelera">Volver a la Cartelera</Link>
        </Button>
        <Button asChild>
          <Link href="/perfil">Ver Mis Reservas</Link>
        </Button>
      </div>
    </div>
  )
}
