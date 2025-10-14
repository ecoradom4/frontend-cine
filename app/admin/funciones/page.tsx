"use client"

import { useState } from "react"
import { RoleGuard } from "@/components/auth/role-guard"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Edit, Trash2, Search, Calendar, Clock, MapPin } from "lucide-react"
import { mockMovies } from "@/data/mock-movies"

interface ShowFunction {
  id: string
  movieId: string
  movieTitle: string
  roomId: string
  roomName: string
  date: string
  time: string
  price: number
  availableSeats: number
  totalSeats: number
}

const mockRooms = [
  { id: "1", name: "Sala 1", capacity: 150 },
  { id: "2", name: "Sala 2", capacity: 120 },
  { id: "3", name: "Sala 3", capacity: 100 },
  { id: "4", name: "Sala 4", capacity: 180 },
  { id: "5", name: "Sala 5", capacity: 200 },
  { id: "6", name: "Sala 6", capacity: 90 },
]

const mockFunctions: ShowFunction[] = [
  {
    id: "1",
    movieId: "1",
    movieTitle: "Guardianes de la Galaxia Vol. 3",
    roomId: "1",
    roomName: "Sala 1",
    date: "2023-12-20",
    time: "14:00",
    price: 12.5,
    availableSeats: 142,
    totalSeats: 150,
  },
  {
    id: "2",
    movieId: "1",
    movieTitle: "Guardianes de la Galaxia Vol. 3",
    roomId: "1",
    roomName: "Sala 1",
    date: "2023-12-20",
    time: "17:30",
    price: 12.5,
    availableSeats: 98,
    totalSeats: 150,
  },
  {
    id: "3",
    movieId: "2",
    movieTitle: "Spider-Man: A Través del Spider-Verso",
    roomId: "2",
    roomName: "Sala 2",
    date: "2023-12-20",
    time: "15:00",
    price: 13.0,
    availableSeats: 85,
    totalSeats: 120,
  },
]

export default function AdminFunctionsPage() {
  const [functions, setFunctions] = useState<ShowFunction[]>(mockFunctions)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingFunction, setEditingFunction] = useState<ShowFunction | null>(null)
  const [validationError, setValidationError] = useState("")
  const [formData, setFormData] = useState({
    movieId: "",
    roomId: "",
    date: "",
    time: "",
    price: "",
  })

  const filteredFunctions = functions.filter(
    (func) =>
      func.movieTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      func.roomName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleOpenDialog = (func?: ShowFunction) => {
    if (func) {
      setEditingFunction(func)
      setFormData({
        movieId: func.movieId,
        roomId: func.roomId,
        date: func.date,
        time: func.time,
        price: func.price.toString(),
      })
    } else {
      setEditingFunction(null)
      setFormData({
        movieId: "",
        roomId: "",
        date: "",
        time: "",
        price: "",
      })
    }
    setValidationError("")
    setIsDialogOpen(true)
  }

  const validateFunction = (movieId: string, roomId: string, date: string, time: string): string => {
    // Check if room is already occupied at this date and time
    const conflictingFunction = functions.find(
      (func) => func.roomId === roomId && func.date === date && func.time === time && func.id !== editingFunction?.id,
    )

    if (conflictingFunction) {
      return `La ${mockRooms.find((r) => r.id === roomId)?.name} ya está ocupada el ${date} a las ${time} con "${conflictingFunction.movieTitle}"`
    }

    return ""
  }

  const handleSave = () => {
    const movie = mockMovies.find((m) => m.id === formData.movieId)
    const room = mockRooms.find((r) => r.id === formData.roomId)

    if (!movie || !room) {
      setValidationError("Selecciona una película y sala válidas")
      return
    }

    const error = validateFunction(formData.movieId, formData.roomId, formData.date, formData.time)
    if (error) {
      setValidationError(error)
      return
    }

    const functionData: ShowFunction = {
      id: editingFunction?.id || Date.now().toString(),
      movieId: formData.movieId,
      movieTitle: movie.title,
      roomId: formData.roomId,
      roomName: room.name,
      date: formData.date,
      time: formData.time,
      price: Number.parseFloat(formData.price),
      availableSeats: editingFunction?.availableSeats || room.capacity,
      totalSeats: room.capacity,
    }

    if (editingFunction) {
      setFunctions(functions.map((f) => (f.id === editingFunction.id ? functionData : f)))
    } else {
      setFunctions([...functions, functionData])
    }

    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta función?")) {
      setFunctions(functions.filter((f) => f.id !== id))
    }
  }

  const getOccupancyColor = (available: number, total: number) => {
    const percentage = (available / total) * 100
    if (percentage > 70) return "text-green-600"
    if (percentage > 30) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Gestión de Funciones</h1>
                <p className="text-muted-foreground">Programa horarios y gestiona funciones</p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Función
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingFunction ? "Editar Función" : "Nueva Función"}</DialogTitle>
                    <DialogDescription>
                      {editingFunction ? "Modifica los datos de la función" : "Programa una nueva función"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="movieId">Película</Label>
                      <Select
                        value={formData.movieId}
                        onValueChange={(value) => setFormData({ ...formData, movieId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una película" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockMovies.map((movie) => (
                            <SelectItem key={movie.id} value={movie.id}>
                              {movie.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="roomId">Sala</Label>
                      <Select
                        value={formData.roomId}
                        onValueChange={(value) => setFormData({ ...formData, roomId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una sala" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockRooms.map((room) => (
                            <SelectItem key={room.id} value={room.id}>
                              {room.name} ({room.capacity} asientos)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Fecha</Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time">Hora</Label>
                        <Input
                          id="time"
                          type="time"
                          value={formData.time}
                          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        />
                      </div>
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

                    {validationError && (
                      <Alert variant="destructive">
                        <AlertDescription>{validationError}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSave}>{editingFunction ? "Guardar Cambios" : "Crear Función"}</Button>
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
                    placeholder="Buscar funciones por película o sala..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Functions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Funciones ({filteredFunctions.length})</CardTitle>
                <CardDescription>Lista de todas las funciones programadas</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Película</TableHead>
                      <TableHead>Sala</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Ocupación</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFunctions.map((func) => (
                      <TableRow key={func.id}>
                        <TableCell className="font-medium">{func.movieTitle}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {func.roomName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {func.date}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {func.time}
                          </div>
                        </TableCell>
                        <TableCell>${func.price.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className={`font-medium ${getOccupancyColor(func.availableSeats, func.totalSeats)}`}>
                            {func.availableSeats}/{func.totalSeats}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round(((func.totalSeats - func.availableSeats) / func.totalSeats) * 100)}% ocupado
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleOpenDialog(func)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(func.id)}>
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
        </main>
      </div>
    </RoleGuard>
  )
}
