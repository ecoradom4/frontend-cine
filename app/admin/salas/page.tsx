"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
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
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Search, MapPin, Loader2 } from "lucide-react"
import { RoleGuard } from "@/components/auth/role-guard"
import { useRooms } from "@/hooks/useRooms"
import type { Room, RoomInput } from "@/services/roomService"

export default function AdminRoomsPage() {
  const { user } = useAuth()
  const {
    rooms,
    locations,
    loading,
    error,
    createRoom,
    updateRoom,
    deleteRoom,
    searchRooms,
    roomTypes,
    roomStatuses,
    roomLocations,
    clearError
  } = useRooms()

  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    capacity: "",
    type: "Estándar" as "Estándar" | "Premium" | "VIP" | "IMAX" | "4DX",
    status: "active" as "active" | "maintenance" | "inactive",
    location: "Planta Baja" as "Planta Baja" | "Primer Piso" | "Segundo Piso" | "Tercer Piso",
  })

  // Filtrar salas localmente para búsqueda en tiempo real
  const filteredRooms = rooms.filter(
    (room) =>
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.location.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleOpenDialog = (room?: Room) => {
    if (room) {
      setEditingRoom(room)
      setFormData({
        name: room.name,
        capacity: room.capacity.toString(),
        type: room.type,
        status: room.status,
        location: room.location,
      })
    } else {
      setEditingRoom(null)
      setFormData({
        name: "",
        capacity: "",
        type: "Estándar",
        status: "active",
        location: "Planta Baja",
      })
    }
    setIsDialogOpen(true)
    clearError() // Limpiar errores anteriores al abrir el diálogo
  }

  const handleSave = async () => {
    if (!formData.name || !formData.capacity || !formData.type || !formData.location) {
      alert("Por favor completa todos los campos requeridos")
      return
    }

    setSaving(true)

    const roomData: RoomInput = {
      name: formData.name,
      capacity: Number.parseInt(formData.capacity),
      type: formData.type,
      status: formData.status,
      location: formData.location,
    }

    try {
      let success: boolean
      
      if (editingRoom) {
        success = await updateRoom(editingRoom.id, roomData)
      } else {
        success = await createRoom(roomData)
      }

      if (success) {
        setIsDialogOpen(false)
        setEditingRoom(null)
        setFormData({
          name: "",
          capacity: "",
          type: "Estándar",
          status: "active",
          location: "Planta Baja",
        })
      }
    } catch (err) {
      // El error ya está manejado por el hook
      console.error('Error guardando sala:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta sala?")) {
      await deleteRoom(id)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    
    // Si la búsqueda está vacía, no hacer nada (el hook ya tiene todas las salas)
    if (!value.trim()) {
      return
    }
    
    // Opcional: puedes usar searchRooms del hook para búsqueras en el servidor
    // searchRooms(value)
  }

  const getStatusColor = (status: Room["status"]) => {
    switch (status) {
      case "active":
        return "bg-chart-5"
      case "maintenance":
        return "bg-chart-4"
      case "inactive":
        return "bg-destructive"
      default:
        return "bg-muted"
    }
  }

  const getStatusLabel = (status: Room["status"]) => {
    switch (status) {
      case "active":
        return "Activa"
      case "maintenance":
        return "Mantenimiento"
      case "inactive":
        return "Inactiva"
      default:
        return "Desconocido"
    }
  }

  if (loading && rooms.length === 0) {
    return (
      <RoleGuard allowedRoles={["admin"]}>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Cargando salas...</span>
            </div>
          </main>
        </div>
      </RoleGuard>
    )
  }

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Gestión de Salas</h1>
                <p className="text-muted-foreground">Administra las salas del cine</p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Sala
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingRoom ? "Editar Sala" : "Nueva Sala"}</DialogTitle>
                    <DialogDescription>
                      {editingRoom ? "Modifica los datos de la sala" : "Agrega una nueva sala al cine"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Sala 1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="capacity">Capacidad *</Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        placeholder="150"
                        min="1"
                        max="500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value: "Estándar" | "Premium" | "VIP" | "IMAX" | "4DX") => 
                          setFormData({ ...formData, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {roomTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Ubicación *</Label>
                      <Select
                        value={formData.location}
                        onValueChange={(value: "Planta Baja" | "Primer Piso" | "Segundo Piso" | "Tercer Piso") => 
                          setFormData({ ...formData, location: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una ubicación" />
                        </SelectTrigger>
                        <SelectContent>
                          {roomLocations.map((location) => (
                            <SelectItem key={location.value} value={location.value}>
                              {location.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Estado *</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: "active" | "maintenance" | "inactive") => 
                          setFormData({ ...formData, status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roomStatuses.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      {editingRoom ? "Guardar Cambios" : "Crear Sala"}
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
                    placeholder="Buscar salas por nombre, tipo o ubicación..."
                    value={searchTerm}
                    onChange={handleSearchChange}
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearError}
                    className="mt-2"
                  >
                    Cerrar
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Rooms Table */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Salas ({filteredRooms.length})
                  {loading && <Loader2 className="h-4 w-4 inline ml-2 animate-spin" />}
                </CardTitle>
                <CardDescription>Lista de todas las salas del cine</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Capacidad</TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRooms.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell className="font-medium">{room.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{room.type}</Badge>
                        </TableCell>
                        <TableCell>{room.capacity} asientos</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {room.location}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(room.status)} text-white border-none`}>
                            {getStatusLabel(room.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleOpenDialog(room)}
                              disabled={loading}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDelete(room.id)}
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {filteredRooms.length === 0 && !loading && (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "No se encontraron salas que coincidan con la búsqueda" : "No se encontraron salas"}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </RoleGuard>
  )
}