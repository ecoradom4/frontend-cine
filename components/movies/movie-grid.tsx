"use client"

import { MovieCard } from "./movie-card" 
import { Skeleton } from "@/components/ui/skeleton"
import { AspectRatio } from "@/components/ui/aspect-ratio"

// ✅ Exporta el tipo Movie desde aquí también para que cartelera/page.tsx lo pueda usar
export interface Movie {
  id: string;
  title: string;
  genre: string;
  duration: number;
  rating: number;
  description: string;
  price: number;
  releaseDate: string;
  poster: string;
  status: 'active' | 'inactive';
  showtimes?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface MovieGridProps {
  movies: Movie[]
  isLoading?: boolean
  showAdminActions?: boolean
}

export function MovieGrid({ movies, isLoading = false, showAdminActions = false }: MovieGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <AspectRatio ratio={2 / 3}>
              <Skeleton className="w-full h-full rounded-lg" />
            </AspectRatio>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (movies.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">No se encontraron películas</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} showAdminActions={showAdminActions} />
      ))}
    </div>
  )
}