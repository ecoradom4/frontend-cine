"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Navbar } from "@/components/layout/navbar"
import { SeatSelection } from "@/components/booking/seat-selection"
import { PaymentForm } from "@/components/booking/payment-form"
import { BookingConfirmation } from "@/components/booking/booking-confirmation"
import { showtimesApi } from "@/services/showtimes-api"
import { moviesApi } from "@/services/movies-api"
import { Seat } from "@/types/seat"

type BookingStep = "seats" | "payment" | "confirmation"

export default function BookingPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()

  const showtimeId = id as string
  const [currentStep, setCurrentStep] = useState<BookingStep>("seats")
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([])
  const [totalPrice, setTotalPrice] = useState(0)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [movieTitle, setMovieTitle] = useState("")
  const [showtimeLabel, setShowtimeLabel] = useState("")
  const [cinemaName, setCinemaName] = useState("")

  // 🧩 Cargar datos de la función desde el backend
  useEffect(() => {
    const fetchShowtimeData = async () => {
      try {
        setIsLoading(true)
        setErrorMessage(null)

        const showtime = await showtimesApi.getShowtimeById(showtimeId)
        const movie = await moviesApi.getMovieById(showtime.movie_id)

        setMovieTitle(movie.title)
        setShowtimeLabel(`${showtime.date} ${showtime.time}`)
        setCinemaName(showtime.room?.name || "Cine Connect Centro")
      } catch (err: any) {
        console.error("Error al cargar la función:", err)
        setErrorMessage("No se pudo cargar la información de la función.")
      } finally {
        setIsLoading(false)
      }
    }

    if (showtimeId) fetchShowtimeData()
  }, [showtimeId])

  // 🧭 Redirigir si no hay usuario autenticado
  useEffect(() => {
    if (!user) router.push("/auth")
  }, [user, router])

  if (!user) return null

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <h2 className="text-muted-foreground">Cargando datos de la función...</h2>
        </div>
      </div>
    )
  }

  if (errorMessage || !movieTitle) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Función no encontrada</h1>
          <p className="text-muted-foreground">{errorMessage ?? "Verifica el enlace o selecciona otra función disponible."}</p>
        </div>
      </div>
    )
  }

  const handleSeatsSelected = (seats: Seat[], total: number) => {
    setSelectedSeats(seats)
    setTotalPrice(total)
    setCurrentStep("payment")
  }

  const handlePaymentComplete = (data: any) => {
    setPaymentData(data)
    setCurrentStep("confirmation")
  }

  const handleBackToSeats = () => {
    setCurrentStep("seats")
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep === "seats" && (
          <SeatSelection
            showtimeId={showtimeId}
            movieTitle={movieTitle}
            showtimeLabel={showtimeLabel}
            cinema={cinemaName}
            onSeatsSelected={handleSeatsSelected}
          />
        )}

        {currentStep === "payment" && (
          <PaymentForm
            movieTitle={movieTitle}
            showtime={showtimeLabel}
            cinema={cinemaName}
            selectedSeats={selectedSeats}
            totalPrice={totalPrice}
            onPaymentComplete={handlePaymentComplete}
            onBack={handleBackToSeats}
            showtimeId={showtimeId} // ✅ agregado
          />
        )}


        {currentStep === "confirmation" && paymentData && (
          <BookingConfirmation paymentData={paymentData} />
        )}
      </main>
    </div>
  )
}
