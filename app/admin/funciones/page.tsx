"use client"

import { useState, useMemo } from "react"
import { useAuth } from "@/contexts/auth-context"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Search, Calendar, Clock, MapPin, Layers, Filter, X } from "lucide-react"

import { useShowtimes } from "@/hooks/useShowtimes"
import { useMovies } from "@/hooks/useMovies"
import { useRooms } from "@/hooks/useRooms"

// ========================
// 🎬 Página principal ACTUALIZADA
// ========================
export default function AdminShowtimesPage() {
  const { user } = useAuth()
  const {
    showtimes,
    loading,
    error,
    createShowtime,
    updateShowtime,
    deleteShowtime,
    scheduleShowtimes,
    clearError,
  } = useShowtimes()

  const { movies } = useMovies()
  const { rooms } = useRooms()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [validationError, setValidationError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("all") // all, today, week, month, year
  const [selectedLocation, setSelectedLocation] = useState("all")
  
  const [formData, setFormData] = useState({
    movie_id: "",
    room_id: "",
    date: "",
    time: "",
    price: "",
  })
  
  const [batchData, setBatchData] = useState({
    movie_id: "",
    room_id: "",
    start_date: "",
    end_date: "", 
    times: "",
    excluded_days: "",
    price_override: "",
  })

  // 🔍 Obtener ubicaciones únicas
  const locations = useMemo(() => {
    const uniqueLocations = new Set(rooms.map(room => room.location).filter(Boolean))
    return ["all", ...Array.from(uniqueLocations)]
  }, [rooms])

  // Función segura para formatear precios
  const formatPrice = (price: any): string => {
    if (price === null || price === undefined) return '0.00'
    
    try {
      const numPrice = typeof price === 'string' ? parseFloat(price) : price
      return typeof numPrice === 'number' && !isNaN(numPrice) ? numPrice.toFixed(2) : '0.00'
    } catch (error) {
      console.warn('Error formatting price:', price, error)
      return '0.00'
    }
  }

  // Función para obtener fecha actual en formato YYYY-MM-DD
  const getCurrentDate = (): string => {
    return new Date().toISOString().split('T')[0]
  }

  // 🔍 Filtrar y procesar funciones
  const processedShowtimes = useMemo(() => {
    let filtered = showtimes

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (s) =>
          s.movie?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.room?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.room?.location?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrar por ubicación
    if (selectedLocation !== "all") {
      filtered = filtered.filter(s => s.room?.location === selectedLocation)
    }

    // Filtrar por fecha
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    switch (dateFilter) {
      case "today":
        filtered = filtered.filter(s => s.date === today)
        break
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        filtered = filtered.filter(s => new Date(s.date) >= weekAgo)
        break
      case "month":
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        filtered = filtered.filter(s => new Date(s.date) >= monthAgo)
        break
      case "year":
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        filtered = filtered.filter(s => new Date(s.date) >= yearAgo)
        break
      default:
        // "all" - no filtrar por fecha
        break
    }

    // Agregar status y ordenar por fecha y hora
    return filtered
      .map(showtime => {
        const showtimeDateTime = new Date(`${showtime.date}T${showtime.time}`)
        const now = new Date()
        
        let status: "upcoming" | "ongoing" | "completed" | "cancelled" = "upcoming"
        
        if (showtime.status === "cancelled") {
          status = "cancelled"
        } else {
          const timeDiff = showtimeDateTime.getTime() - now.getTime()
          const thirtyMinutes = 30 * 60 * 1000
          
          if (timeDiff < -60 * 60 * 1000) { // Más de 1 hora en el pasado
            status = "completed"
          } else if (timeDiff <= thirtyMinutes && timeDiff > -60 * 60 * 1000) { // 30 minutos antes hasta 1 hora después
            status = "ongoing"
          } else {
            status = "upcoming"
          }
        }
        
        return {
          ...showtime,
          status,
          datetime: showtimeDateTime
        }
      })
      .sort((a, b) => a.datetime.getTime() - b.datetime.getTime())
  }, [searchTerm, showtimes, dateFilter, selectedLocation])

  // 📊 Agrupar funciones por ubicación para las pestañas
  const showtimesByLocation = useMemo(() => {
    const grouped: Record<string, typeof processedShowtimes> = {}
    
    processedShowtimes.forEach(showtime => {
      const location = showtime.room?.location || "Sin ubicación"
      if (!grouped[location]) {
        grouped[location] = []
      }
      grouped[location].push(showtime)
    })
    
    return grouped
  }, [processedShowtimes])

  const handleOpenDialog = (showtime?: any) => {
    if (showtime) {
      setEditing(showtime.id)
      setFormData({
        movie_id: showtime.movie_id,
        room_id: showtime.room_id,
        date: showtime.date,
        time: showtime.time,
        price: formatPrice(showtime.price),
      })
    } else {
      setEditing(null)
      setFormData({
        movie_id: "",
        room_id: "",
        date: getCurrentDate(),
        time: "",
        price: "",
      })
    }
    setValidationError("")
    setIsDialogOpen(true)
  }

  const resetFormData = () => {
    setFormData({
      movie_id: "",
      room_id: "",
      date: getCurrentDate(),
      time: "",
      price: "",
    })
    setBatchData({
      movie_id: "",
      room_id: "",
      start_date: "",
      end_date: "",
      times: "",
      excluded_days: "",
      price_override: "",
    })
    setEditing(null)
    setValidationError("")
  }

  const handleSave = async () => {
    if (!formData.movie_id || !formData.room_id || !formData.date || !formData.time) {
      setValidationError("Completa todos los campos obligatorios.")
      return
    }

    const payload = {
      movie_id: formData.movie_id,
      room_id: formData.room_id,
      date: formData.date,
      time: formData.time,
      price: formData.price ? parseFloat(formData.price) : undefined,
    }

    try {
      if (editing) {
        await updateShowtime(editing, payload)
      } else {
        await createShowtime(payload)
      }
      setIsDialogOpen(false)
      resetFormData()
    } catch (err: any) {
      setValidationError(err.message || "Error al guardar función")
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("¿Seguro que deseas eliminar esta función?")) {
      await deleteShowtime(id)
    }
  }

  const handleBatchSchedule = async () => {
    if (!batchData.movie_id || !batchData.room_id || !batchData.start_date || !batchData.end_date) {
      setValidationError("Completa los campos obligatorios para programar.")
      return
    }

    const payload = {
      movie_id: batchData.movie_id,
      room_id: batchData.room_id,
      start_date: batchData.start_date,
      end_date: batchData.end_date,
      times: batchData.times.split(",").map((t) => t.trim()),
      excluded_days: batchData.excluded_days
        ? batchData.excluded_days.split(",").map((d) => d.trim())
        : undefined,
      price_override: batchData.price_override ? Number(batchData.price_override) : undefined,
    }

    try {
      const result = await scheduleShowtimes(payload)
      alert(
        `✅ ${result.summary?.total_generated} funciones creadas.\n❌ ${result.summary?.total_skipped} omitidas.`
      )
      setIsBatchDialogOpen(false)
      resetFormData()
    } catch (err: any) {
      setValidationError(err.message || "Error al programar funciones")
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      upcoming: "default",
      ongoing: "secondary",
      completed: "outline",
      cancelled: "destructive"
    } as const

    const labels = {
      upcoming: "Próxima",
      ongoing: "En curso",
      completed: "Completada",
      cancelled: "Cancelada"
    }

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    )
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeStr: string) => {
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Resetear filtros
  const clearFilters = () => {
    setSearchTerm("")
    setDateFilter("all")
    setSelectedLocation("all")
  }

  // Cerrar alertas de error
  const handleCloseError = () => {
    clearError?.()
    setValidationError("")
  }

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Alertas de error en la parte superior */}
            {(error || validationError) && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription className="flex justify-between items-center">
                  <span>{error || validationError}</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCloseError}
                    className="ml-4"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Gestión de Funciones</h1>
                <p className="text-muted-foreground">Programa horarios y gestiona funciones de películas</p>
              </div>
              <div className="flex gap-2">
                {/* Programación en lote */}
                <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="secondary">
                      <Layers className="h-4 w-4 mr-2" /> Programar Lote
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Programar Funciones en Lote</DialogTitle>
                      <DialogDescription>
                        Genera múltiples funciones automáticamente en un rango de fechas.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Película *</Label>
                          <Select
                            value={batchData.movie_id}
                            onValueChange={(v) => setBatchData({ ...batchData, movie_id: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona película" />
                            </SelectTrigger>
                            <SelectContent>
                              {movies.map((m) => (
                                <SelectItem key={m.id} value={m.id}>
                                  {m.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Sala *</Label>
                          <Select
                            value={batchData.room_id}
                            onValueChange={(v) => setBatchData({ ...batchData, room_id: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona sala" />
                            </SelectTrigger>
                            <SelectContent>
                              {rooms.map((r) => (
                                <SelectItem key={r.id} value={r.id}>
                                  {r.name} ({r.location})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Fecha inicio *</Label>
                          <Input 
                            type="date" 
                            value={batchData.start_date} 
                            onChange={(e) => setBatchData({ ...batchData, start_date: e.target.value })} 
                            min={getCurrentDate()}
                          />
                        </div>
                        <div>
                          <Label>Fecha fin *</Label>
                          <Input 
                            type="date" 
                            value={batchData.end_date} 
                            onChange={(e) => setBatchData({ ...batchData, end_date: e.target.value })} 
                            min={batchData.start_date || getCurrentDate()}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Horarios * (separados por coma)</Label>
                        <Input 
                          placeholder="14:00, 17:00, 20:00" 
                          value={batchData.times} 
                          onChange={(e) => setBatchData({ ...batchData, times: e.target.value })} 
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Ejemplo: 14:00, 17:00, 20:00
                        </p>
                      </div>
                      
                      <div>
                        <Label>Días excluidos (opcional)</Label>
                        <Input 
                          placeholder="monday, wednesday, saturday" 
                          value={batchData.excluded_days} 
                          onChange={(e) => setBatchData({ ...batchData, excluded_days: e.target.value })} 
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Ejemplo: monday, wednesday, saturday
                        </p>
                      </div>
                      
                      <div>
                        <Label>Precio personalizado (opcional)</Label>
                        <Input 
                          type="number" 
                          step="0.5" 
                          min="0"
                          value={batchData.price_override} 
                          onChange={(e) => setBatchData({ ...batchData, price_override: e.target.value })} 
                        />
                      </div>

                      {validationError && (
                        <Alert variant="destructive">
                          <AlertDescription>{validationError}</AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => {
                          setIsBatchDialogOpen(false)
                          setValidationError("")
                        }}>
                          Cancelar
                        </Button>
                        <Button onClick={handleBatchSchedule} disabled={loading}>
                          {loading ? "Procesando..." : "Programar Funciones"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Nueva función individual */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => handleOpenDialog()}>
                      <Plus className="h-4 w-4 mr-2" /> Nueva Función
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editing ? "Editar Función" : "Nueva Función"}</DialogTitle>
                      <DialogDescription>
                        {editing ? "Modifica los datos de la función" : "Completa los datos de la nueva función"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Película *</Label>
                        <Select 
                          value={formData.movie_id} 
                          onValueChange={(v) => setFormData({ ...formData, movie_id: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona película" />
                          </SelectTrigger>
                          <SelectContent>
                            {movies.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Sala *</Label>
                        <Select 
                          value={formData.room_id} 
                          onValueChange={(v) => setFormData({ ...formData, room_id: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona sala" />
                          </SelectTrigger>
                          <SelectContent>
                            {rooms.map((r) => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.name} ({r.location}) - {r.type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Fecha *</Label>
                          <Input 
                            type="date" 
                            value={formData.date} 
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })} 
                            min={getCurrentDate()}
                          />
                        </div>
                        <div>
                          <Label>Hora *</Label>
                          <Input 
                            type="time" 
                            value={formData.time} 
                            onChange={(e) => setFormData({ ...formData, time: e.target.value })} 
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Precio (Q)</Label>
                        <Input 
                          type="number" 
                          step="0.5" 
                          min="0"
                          value={formData.price} 
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })} 
                          placeholder="Precio automático si está vacío"
                        />
                      </div>
                      
                      {validationError && (
                        <Alert variant="destructive">
                          <AlertDescription>{validationError}</AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => {
                          setIsDialogOpen(false)
                          setValidationError("")
                        }}>
                          Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={loading}>
                          {loading ? "Guardando..." : editing ? "Guardar Cambios" : "Crear Función"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Filtros */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                  <div className="flex-1 w-full lg:w-auto">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Buscar por película, sala o ubicación..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="pl-10 w-full lg:w-80"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="w-full sm:w-40">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filtrar por fecha" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las fechas</SelectItem>
                        <SelectItem value="today">Hoy</SelectItem>
                        <SelectItem value="week">Esta semana</SelectItem>
                        <SelectItem value="month">Este mes</SelectItem>
                        <SelectItem value="year">Este año</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                      <SelectTrigger className="w-full sm:w-48">
                        <MapPin className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Todas las ubicaciones" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map(location => (
                          <SelectItem key={location} value={location}>
                            {location === "all" ? "Todas las ubicaciones" : location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto whitespace-nowrap">
                      Limpiar Filtros
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{processedShowtimes.length}</div>
                  <div className="text-sm text-muted-foreground">Total funciones</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {processedShowtimes.filter(s => s.status === 'upcoming').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Próximas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {processedShowtimes.filter(s => s.status === 'ongoing').length}
                  </div>
                  <div className="text-sm text-muted-foreground">En curso</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-gray-600">
                    {processedShowtimes.filter(s => s.status === 'completed').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Completadas</div>
                </CardContent>
              </Card>
            </div>

            {/* Contenido principal con pestañas */}
            <Card>
              <CardHeader>
                <CardTitle>Funciones ({processedShowtimes.length})</CardTitle>
                <CardDescription>
                  {selectedLocation !== "all" && `Ubicación: ${selectedLocation} • `}
                  {dateFilter !== "all" && `Filtro: ${
                    dateFilter === 'today' ? 'Hoy' :
                    dateFilter === 'week' ? 'Esta semana' :
                    dateFilter === 'month' ? 'Este mes' : 'Este año'
                  }`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={Object.keys(showtimesByLocation)[0] || "all"} className="w-full">
                  <TabsList className="w-full overflow-x-auto flex flex-nowrap mb-6 h-auto py-2">
                    {Object.keys(showtimesByLocation).slice(0, 3).map(location => (
                      <TabsTrigger 
                        key={location} 
                        value={location} 
                        className="flex flex-col items-center min-w-0 flex-1 px-3 py-2"
                      >
                        <MapPin className="h-4 w-4 mb-1 flex-shrink-0" />
                        <span className="text-xs truncate max-w-full">
                          {location} ({showtimesByLocation[location].length})
                        </span>
                      </TabsTrigger>
                    ))}
                    {Object.keys(showtimesByLocation).length > 3 && (
                      <TabsTrigger value="all" className="flex flex-col items-center min-w-0 flex-1 px-3 py-2">
                        <Layers className="h-4 w-4 mb-1" />
                        <span className="text-xs">
                          Todas ({processedShowtimes.length})
                        </span>
                      </TabsTrigger>
                    )}
                    {Object.keys(showtimesByLocation).length <= 3 && (
                      <TabsTrigger value="all" className="flex flex-col items-center min-w-0 flex-1 px-3 py-2">
                        <Layers className="h-4 w-4 mb-1" />
                        <span className="text-xs">
                          Todas ({processedShowtimes.length})
                        </span>
                      </TabsTrigger>
                    )}
                  </TabsList>

                  {/* Contenido de cada pestaña de ubicación */}
                  {Object.entries(showtimesByLocation).map(([location, locationShowtimes]) => (
                    <TabsContent key={location} value={location} className="space-y-4">
                      <div className="rounded-lg border p-4">
                        <h3 className="font-semibold mb-4 flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          {location} - {locationShowtimes.length} función(es)
                        </h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Película</TableHead>
                              <TableHead>Sala</TableHead>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Hora</TableHead>
                              <TableHead>Precio</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {locationShowtimes.map((s) => (
                              <TableRow key={s.id} className={
                                s.status === 'completed' ? 'opacity-60' : 
                                s.status === 'cancelled' ? 'bg-red-50' : ''
                              }>
                                <TableCell>
                                  <div className="font-medium">{s.movie?.title}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {s.movie?.duration} min • {s.movie?.rating}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium">{s.room?.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {s.room?.type} • {s.room?.capacity} asientos
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                    {formatDate(s.date)}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center">
                                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                    {formatTime(s.time)}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-semibold">Q{formatPrice(s.price)}</div>
                                  {s.ticket_prices && (
                                    <div className="text-xs text-muted-foreground">
                                      P: Q{formatPrice(s.ticket_prices.premium)} • V: Q{formatPrice(s.ticket_prices.vip)}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(s.status)}
                                  {s.available_seats !== undefined && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {s.available_seats}/{s.total_seats} asientos
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => handleOpenDialog(s)}
                                      disabled={s.status === 'completed' || s.status === 'cancelled'}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => handleDelete(s.id)}
                                      disabled={s.status === 'completed'}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                            {locationShowtimes.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                  No hay funciones programadas para esta ubicación con los filtros actuales
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                  ))}

                  {/* Pestaña "Todas" */}
                  <TabsContent value="all" className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Película</TableHead>
                          <TableHead>Sala</TableHead>
                          <TableHead>Ubicación</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Hora</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {processedShowtimes.map((s) => (
                          <TableRow key={s.id} className={
                            s.status === 'completed' ? 'opacity-60' : 
                            s.status === 'cancelled' ? 'bg-red-50' : ''
                          }>
                            <TableCell>
                              <div className="font-medium">{s.movie?.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {s.movie?.duration} min • {s.movie?.rating}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{s.room?.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {s.room?.type}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center text-sm">
                                <MapPin className="h-3 w-3 mr-1" />
                                {s.room?.location || "Sin ubicación"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                {formatDate(s.date)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                {formatTime(s.time)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold">Q{formatPrice(s.price)}</div>
                              {s.ticket_prices && (
                                <div className="text-xs text-muted-foreground">
                                  P: Q{formatPrice(s.ticket_prices.premium)} • V: Q{formatPrice(s.ticket_prices.vip)}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(s.status)}
                              {s.available_seats !== undefined && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {s.available_seats}/{s.total_seats} asientos
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleOpenDialog(s)}
                                  disabled={s.status === 'completed' || s.status === 'cancelled'}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleDelete(s.id)}
                                  disabled={s.status === 'completed'}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {processedShowtimes.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-12">
                              <div className="text-muted-foreground">
                                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p className="text-lg font-medium mb-2">No hay funciones programadas</p>
                                <p className="text-sm mb-4">
                                  {searchTerm || dateFilter !== 'all' || selectedLocation !== 'all' 
                                    ? "Intenta ajustar los filtros de búsqueda" 
                                    : "Comienza creando una nueva función o programando en lote"
                                  }
                                </p>
                                <Button onClick={() => handleOpenDialog()}>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Crear Primera Función
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Estado de carga */}
            {loading && (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-muted rounded w-1/4 mx-auto"></div>
                    <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </RoleGuard>
  )
}