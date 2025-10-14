"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search, Filter } from "lucide-react"
import { moviesApi } from "@/services/movies-api"

interface MovieFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  selectedGenre: string
  onGenreChange: (value: string) => void
  selectedDate: string
  onDateChange: (value: string) => void
  onClearFilters: () => void
}

export function MovieFilters({
  searchTerm,
  onSearchChange,
  selectedGenre,
  onGenreChange,
  selectedDate,
  onDateChange,
  onClearFilters,
}: MovieFiltersProps) {
  const [genres, setGenres] = useState<string[]>([])
  const [loadingGenres, setLoadingGenres] = useState(true)

  // 🧠 Cargar géneros desde el backend
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const data = await moviesApi.getGenres()
        setGenres(["Todos", ...data])
      } catch (err) {
        console.error("Error al obtener géneros:", err)
        setGenres(["Todos"]) // fallback
      } finally {
        setLoadingGenres(false)
      }
    }

    fetchGenres()
  }, [])

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Filtros</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 🔍 Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título o descripción..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* 🎭 Genre Filter */}
        <Select
          value={selectedGenre}
          onValueChange={onGenreChange}
          disabled={loadingGenres}
        >
          <SelectTrigger>
            <SelectValue placeholder="Género" />
          </SelectTrigger>
          <SelectContent>
            {genres.map((genre) => (
              <SelectItem key={genre} value={genre}>
                {genre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 📅 Showtime Date Filter */}
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="cursor-pointer"
        />
      </div>

      <div className="flex justify-end mt-4">
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          Limpiar filtros
        </Button>
      </div>
    </div>
  )
}
