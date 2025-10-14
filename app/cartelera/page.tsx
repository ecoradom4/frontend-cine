"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Navbar } from "@/components/layout/navbar"
import { MovieGrid } from "@/components/movies/movie-grid"
import { MovieFilters } from "@/components/movies/movie-filters"
import { moviesApi, type UIMovie } from "@/services/movies-api"

export default function CarteleraPage() {
  const { user } = useAuth()
  const [movies, setMovies] = useState<UIMovie[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("Todos")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedCinema, setSelectedCinema] = useState("Todas las sucursales")

  useEffect(() => {
  const fetchMovies = async () => {
    try {
      setIsLoading(true)
      const params: any = {}
      if (searchTerm) params.search = searchTerm
      if (selectedGenre !== "Todos") params.genre = selectedGenre

      const data = await moviesApi.getMovies(params)

      // 🔍 Filtrado adicional en el front
      const filtered = data.movies.filter(
        (m) =>
          m.status === "active" &&
          m.showtimes.length > 0 &&
          (!selectedDate || m.showtimes.some((s) => s.startsWith(selectedDate)))
      )

      setMovies(filtered)
    } catch (err) {
      console.error("Error al obtener películas:", err)
    } finally {
      setIsLoading(false)
    }
  }

  fetchMovies()
}, [searchTerm, selectedGenre, selectedDate])


  const handleClearFilters = () => {
    setSearchTerm("")
    setSelectedGenre("Todos")
    setSelectedDate("")
    setSelectedCinema("Todas las sucursales")
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Cartelera</h1>
          <p className="text-muted-foreground">Descubre las mejores películas en cartelera</p>
        </div>

        <MovieFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedGenre={selectedGenre}
          onGenreChange={setSelectedGenre}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onClearFilters={handleClearFilters}
        />

        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Mostrando {movies.length} película{movies.length !== 1 ? "s" : ""}
          </p>
        </div>

        <MovieGrid
          movies={movies}
          isLoading={isLoading}
          showAdminActions={user?.role === "admin"}
        />
      </main>
    </div>
  )
}
