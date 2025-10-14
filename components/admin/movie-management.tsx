"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, Search } from "lucide-react"
import { mockMovies } from "@/data/mock-movies"
import type { Movie } from "@/components/movies/movie-card"

export function MovieManagement() {
  const [movies, setMovies] = useState<Movie[]>(mockMovies)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    genre: "",
    duration: "",
    rating: "",
    description: "",
    price: "",
    releaseDate: "",
    poster: "",
  })

  const filteredMovies = movies.filter(
    (movie) =>
      movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movie.genre.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleOpenDialog = (movie?: Movie) => {
    if (movie) {
      setEditingMovie(movie)
      setFormData({
        title: movie.title,
        genre: movie.genre,
        duration: movie.duration.toString(),
        rating: movie.rating.toString(),
        description: movie.description,
        price: movie.price.toString(),
        releaseDate: movie.releaseDate,
        poster: movie.poster,
      })
    } else {
      setEditingMovie(null)
      setFormData({
        title: "",
        genre: "",
        duration: "",
        rating: "",
        description: "",
        price: "",
        releaseDate: "",
        poster: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    const movieData: Movie = {
      id: editingMovie?.id || Date.now().toString(),
      title: formData.title,
      genre: formData.genre,
      duration: Number.parseInt(formData.duration),
      rating: Number.parseFloat(formData.rating),
      description: formData.description,
      price: Number.parseFloat(formData.price),
      releaseDate: formData.releaseDate,
      poster: formData.poster || "/placeholder.svg",
      showtimes: editingMovie?.showtimes || ["14:00", "17:00", "20:00"],
    }

    if (editingMovie) {
      setMovies(movies.map((m) => (m.id === editingMovie.id ? movieData : m)))
    } else {
      setMovies([...movies, movieData])
    }

    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta película?")) {
      setMovies(movies.filter((m) => m.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Películas</h1>
          <p className="text-muted-foreground">Administra el catálogo de películas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Película
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingMovie ? "Editar Película" : "Nueva Película"}</DialogTitle>
              <DialogDescription>
                {editingMovie ? "Modifica los datos de la película" : "Agrega una nueva película al catálogo"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título de la película"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="genre">Género</Label>
                <Select value={formData.genre} onValueChange={(value) => setFormData({ ...formData, genre: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Acción">Acción</SelectItem>
                    <SelectItem value="Aventura">Aventura</SelectItem>
                    <SelectItem value="Comedia">Comedia</SelectItem>
                    <SelectItem value="Drama">Drama</SelectItem>
                    <SelectItem value="Terror">Terror</SelectItem>
                    <SelectItem value="Ciencia Ficción">Ciencia Ficción</SelectItem>
                    <SelectItem value="Romance">Romance</SelectItem>
                    <SelectItem value="Thriller">Thriller</SelectItem>
                    <SelectItem value="Animación">Animación</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duración (minutos)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="120"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating">Calificación (1-10)</Label>
                <Input
                  id="rating"
                  type="number"
                  step="0.1"
                  min="1"
                  max="10"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  placeholder="8.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Precio ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.5"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="12.50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="releaseDate">Fecha de estreno</Label>
                <Input
                  id="releaseDate"
                  type="date"
                  value={formData.releaseDate}
                  onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="poster">URL del póster</Label>
                <Input
                  id="poster"
                  value={formData.poster}
                  onChange={(e) => setFormData({ ...formData, poster: e.target.value })}
                  placeholder="https://ejemplo.com/poster.jpg"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción de la película..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>{editingMovie ? "Guardar Cambios" : "Crear Película"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar películas por título o género..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Movies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Películas ({filteredMovies.length})</CardTitle>
          <CardDescription>Lista de todas las películas en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Género</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Calificación</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Estreno</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMovies.map((movie) => (
                <TableRow key={movie.id}>
                  <TableCell className="font-medium">{movie.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{movie.genre}</Badge>
                  </TableCell>
                  <TableCell>{movie.duration} min</TableCell>
                  <TableCell>{movie.rating}/10</TableCell>
                  <TableCell>${movie.price}</TableCell>
                  <TableCell>{movie.releaseDate}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDialog(movie)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(movie.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
