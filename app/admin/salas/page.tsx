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
import { Plus, Edit, Trash2, Search, MapPin } from "lucide-react"
import { RoleGuard } from "@/components/auth/role-guard"

interface Room {
  id: string
  name: string
  capacity: number
  type: string
  status: "active" | "maintenance" | "inactive"
  location: string
}

const mockRooms: Room[] = [
  { id: "1", name: "Sala 1", capacity: 150, type: "Estándar", status: "active", location: "Planta Baja" },
  { id: "2", name: "Sala 2", capacity: 120, type: "Premium", status: "active", location: "Planta Baja" },
  { id: "3", name: "Sala 3", capacity: 100, type: "VIP", status: "maintenance", location: "Primer Piso" },
  { id: "4", name: "Sala 4", capacity: 180, type: "IMAX", status: "active", location: "Primer Piso" },
  { id: "5", name: "Sala 5", capacity: 200, type: "Estándar", status: "active", location: "Segundo Piso" },
  { id: "6", name: "Sala 6", capacity: 90, type: "Premium", status: "inactive", location: "Segundo Piso" },
]

export default function AdminRoomsPage() {
  const { user } = useAuth()
  const [rooms, setRooms] = useState<Room[]>(mockRooms)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    capacity: "",
    type: "",
    status: "active" as Room["status"],
    location: "",
  })

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
        type: "",
        status: "active",
        location: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    const roomData: Room = {
      id: editingRoom?.id || Date.now().toString(),
      name: formData.name,
      capacity: Number.parseInt(formData.capacity),
      type: formData.type,
      status: formData.status,
      location: formData.location,
    }

    if (editingRoom) {
      setRooms(rooms.map((r) => (r.id === editingRoom.id ? roomData : r)))
    } else {
      setRooms([...rooms, roomData])
    }

    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta sala?")) {
      setRooms(rooms.filter((r) => r.id !== id))
    }
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
                      <Label htmlFor="name">Nombre</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Sala 1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="capacity">Capacidad</Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        placeholder="150"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Estándar">Estándar</SelectItem>
                          <SelectItem value="Premium">Premium</SelectItem>
                          <SelectItem value="VIP">VIP</SelectItem>
                          <SelectItem value="IMAX">IMAX</SelectItem>
                          <SelectItem value="4DX">4DX</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Ubicación</Label>
                      <Select
                        value={formData.location}
                        onValueChange={(value) => setFormData({ ...formData, location: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una ubicación" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Planta Baja">Planta Baja</SelectItem>
                          <SelectItem value="Primer Piso">Primer Piso</SelectItem>
                          <SelectItem value="Segundo Piso">Segundo Piso</SelectItem>
                          <SelectItem value="Tercer Piso">Tercer Piso</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Estado</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: Room["status"]) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Activa</SelectItem>
                          <SelectItem value="maintenance">Mantenimiento</SelectItem>
                          <SelectItem value="inactive">Inactiva</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSave}>{editingRoom ? "Guardar Cambios" : "Crear Sala"}</Button>
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
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Rooms Table */}
            <Card>
              <CardHeader>
                <CardTitle>Salas ({filteredRooms.length})</CardTitle>
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
                            <Button variant="outline" size="sm" onClick={() => handleOpenDialog(room)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(room.id)}>
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
