"use client"

import { Card } from "@/components/ui/card"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Clock, Calendar } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

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

interface MovieCardProps {
  movie: Movie
  showAdminActions?: boolean
}

export function MovieCard({ movie, showAdminActions = false }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="group relative transition-all duration-300 hover:scale-105 hover:z-10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className="overflow-hidden bg-card/80 backdrop-blur-sm border-border/50 transition-all duration-300 group-hover:bg-card group-hover:border-primary/20 group-hover:shadow-xl group-hover:shadow-primary/10">
        <div className="relative">
          <AspectRatio ratio={2 / 3}>
            <img
              src={movie.poster || "/placeholder.svg"}
              alt={movie.title}
              className="object-cover w-full h-full transition-all duration-300 group-hover:brightness-110"
            />
          </AspectRatio>

          {/* Overlay with movie info - appears on hover */}
          <div
            className={`absolute inset-0 bg-gradient-to-t from-background/95 via-background/70 to-transparent transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"}`}
          >
            <div className="absolute bottom-0 left-0 right-0 p-4 text-foreground">
              <h3 className="font-bold text-lg mb-2 text-balance">{movie.title}</h3>

              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  {movie.genre}
                </Badge>
                <div className="flex items-center gap-1 text-xs">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{movie.rating}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{movie.duration} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{movie.releaseDate}</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{movie.description}</p>

              <div className="flex gap-2">
                <Button asChild size="sm" className="flex-1">
                  <Link href={`/pelicula/${movie.id}`}>Ver Detalles</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Rating badge - always visible */}
          <div className="absolute top-2 right-2">
            <Badge className="bg-background/90 text-foreground border border-border">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
              {movie.rating}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  )
}
