"use client"

import { useState, useEffect } from "react"
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
import { Plus, Edit, Trash2, Search, Loader2 } from "lucide-react"
import { useMovies } from "@/hooks/useMovies";
import { movieService } from "@/services/movieService"
import type { MovieWithStatus } from "@/services/movieService"

// Función utilitaria para manejar fechas
const formatDateForInput = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      const match = dateString.match(/(\d{4}-\d{2}-\d{2})/);
      if (match) {
        const fixedDate = new Date(match[1]);
        if (!isNaN(fixedDate.getTime())) {
          return fixedDate.toLocaleDateString('es-ES');
        }
      }
      return 'Fecha inválida';
    }
    
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return 'Error en fecha';
  }
};

// Componente para mostrar el badge de status
const StatusBadge = ({ status }: { status: 'active' | 'inactive' }) => {
  return (
    <Badge 
      variant={status === 'active' ? 'default' : 'secondary'}
      className={status === 'active' ? 'bg-green-500' : 'bg-gray-500'}
    >
      {status === 'active' ? 'Activo' : 'Inactivo'}
    </Badge>
  );
};

export function MovieManagement() {
  const { movies, loading, error, createMovie, updateMovie, deleteMovie, fetchMovies } = useMovies()
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMovie, setEditingMovie] = useState<MovieWithStatus | null>(null)
  const [genres, setGenres] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    genre: "",
    duration: "",
    rating: "",
    description: "",
    price: "",
    release_date: "",
    poster: "",
    status: "active" as 'active' | 'inactive',
  })

  // Cargar géneros disponibles
  useEffect(() => {
    const loadGenres = async () => {
      try {
        const genresList = await movieService.getGenres()
        setGenres(genresList)
      } catch (err) {
        console.error('Error cargando géneros:', err)
      }
    }
    loadGenres()
  }, [])

  const filteredMovies = movies.filter(
    (movie) =>
      movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movie.genre.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleOpenDialog = (movie?: MovieWithStatus) => {
    if (movie) {
      setEditingMovie(movie)
      setFormData({
        title: movie.title,
        genre: movie.genre,
        duration: movie.duration.toString(),
        rating: movie.rating.toString(),
        description: movie.description,
        price: movie.price.toString(),
        release_date: formatDateForInput(movie.releaseDate),
        poster: movie.poster,
        status: movie.status || 'active',
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
        release_date: "",
        poster: "",
        status: "active",
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.title || !formData.genre || !formData.duration || !formData.rating || 
        !formData.description || !formData.price || !formData.release_date) {
      alert("Por favor completa todos los campos requeridos")
      return
    }

    setSaving(true)

    const movieData = {
      title: formData.title,
      genre: formData.genre,
      duration: Number.parseInt(formData.duration),
      rating: Number.parseFloat(formData.rating),
      description: formData.description,
      price: Number.parseFloat(formData.price),
      release_date: formData.release_date,
      poster: formData.poster || undefined,
      status: formData.status,
    }

    try {
      let success: boolean
      
      if (editingMovie) {
        success = await updateMovie(editingMovie.id, movieData)
      } else {
        success = await createMovie(movieData)
      }

      if (success) {
        setIsDialogOpen(false)
        setEditingMovie(null)
      }
    } catch (err) {
      console.error('Error guardando película:', err)
      alert(err instanceof Error ? err.message : 'Error al guardar la película')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta película?")) {
      try {
        await deleteMovie(id)
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Error al eliminar la película')
      }
    }
  }

  if (loading && movies.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando películas...</span>
      </div>
    )
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
                {!formData.poster && " - El poster se buscará automáticamente en OMDB si se deja vacío"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título de la película"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="genre">Género *</Label>
                <Select value={formData.genre} onValueChange={(value) => setFormData({ ...formData, genre: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un género" />
                  </SelectTrigger>
                  <SelectContent>
                    {genres.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duración (minutos) *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="120"
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating">Calificación (1-10) *</Label>
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
                <Label htmlFor="price">Precio (Q) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="35.50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="release_date">Fecha de estreno *</Label>
                <Input
                  id="release_date"
                  type="date"
                  value={formData.release_date}
                  onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Estado *</Label>
                <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="poster">URL del póster (opcional)</Label>
                <Input
                  id="poster"
                  value={formData.poster}
                  onChange={(e) => setFormData({ ...formData, poster: e.target.value })}
                  placeholder="Dejar vacío para buscar automáticamente en OMDB"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="description">Descripción *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción de la película..."
                  rows={3}
                />
              </div>
            </div>
            {error && (
              <div className="bg-destructive/15 text-destructive px-3 py-2 rounded-md text-sm">
                {error}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving}
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingMovie ? "Guardar Cambios" : "Crear Película"}
              </Button>
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

      {/* Error Message */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="text-destructive text-sm">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Movies Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Películas ({filteredMovies.length})
            {loading && <Loader2 className="h-4 w-4 inline ml-2 animate-spin" />}
          </CardTitle>
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
                <TableHead>Estado</TableHead>
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
                  <TableCell>Q{movie.price}</TableCell>
                  <TableCell>{formatDateForDisplay(movie.releaseDate)}</TableCell>
                  <TableCell>
                    <StatusBadge status={movie.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleOpenDialog(movie)}
                        disabled={loading}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(movie.id)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredMovies.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron películas
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}