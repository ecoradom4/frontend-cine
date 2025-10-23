"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Star, Clock, Calendar, ArrowLeft, MapPin, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { moviesApi } from "@/services/movies-api";
import { roomsApi } from "@/services/rooms-api";
import { showtimesApi } from "@/services/showtimes-api";

type Room = {
  id: string;
  name: string;
  type: string;
  location: string;
  status: string;
};

type Showtime = {
  id: string;
  movie_id: string;
  room_id: string;
  date: string;
  time: string;
  price: string;
  room?: {
    id: string;
    name: string;
    type?: string;
    location?: string;
  };
};

const useDebouncedValue = (value: string, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

export default function MovieDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const movieId = params.id as string;

  const [movie, setMovie] = useState<any>(null);
  const [allShowtimes, setAllShowtimes] = useState<Showtime[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  // Estados de carga separados
  const [isLoadingMovie, setIsLoadingMovie] = useState(true);
  const [isLoadingShowtimes, setIsLoadingShowtimes] = useState(true);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  // Filtros
  const [searchRoom, setSearchRoom] = useState("");
  const debouncedSearch = useDebouncedValue(searchRoom, 300);
  const [roomType, setRoomType] = useState<string>("");
  const [roomLocation, setRoomLocation] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");

  // 1) Película - carga crítica
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setIsLoadingMovie(true);
        const data = await moviesApi.getMovieById(movieId);
        if (mounted) {
          setMovie(data);
        }
      } catch (err) {
        console.error("Error al cargar película:", err);
        if (mounted) {
          setMovie(null);
        }
      } finally {
        if (mounted) {
          setIsLoadingMovie(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [movieId]);

  // 2) Salas activas
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setIsLoadingRooms(true);
        const data = await roomsApi.getRooms({
          status: "active",
        });
        if (mounted) {
          setRooms((data.rooms || []).filter((r: Room) => r.status === "active"));
        }
      } catch (err) {
        console.error("Error al cargar salas:", err);
        if (mounted) {
          setRooms([]);
        }
      } finally {
        if (mounted) {
          setIsLoadingRooms(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // 3) Showtimes
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setIsLoadingShowtimes(true);
        const data = await showtimesApi.getShowtimes({
          movieId,
        });
        if (mounted) {
          const list = (data.showtimes || []).sort((a: Showtime, b: Showtime) => {
            const aDate = new Date(`${a.date}T${a.time}`);
            const bDate = new Date(`${b.date}T${b.time}`);
            return aDate.getTime() - bDate.getTime();
          });
          setAllShowtimes(list);
        }
      } catch (err) {
        console.error("Error al cargar funciones:", err);
        if (mounted) {
          setAllShowtimes([]);
        }
      } finally {
        if (mounted) {
          setIsLoadingShowtimes(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [movieId]);

  // Pipeline de filtrado progresivo
  const filteredShowtimes = useMemo(() => {
    if (isLoadingShowtimes || isLoadingRooms) return [];

    const search = debouncedSearch.trim().toLowerCase();

    return allShowtimes.filter((s) => {
      const room = rooms.find((r) => r.id === s.room_id);
      if (!room) return false;

      // Filtro de búsqueda
      if (search) {
        const hayCoincidencia =
          room.name?.toLowerCase().includes(search) ||
          room.location?.toLowerCase().includes(search);
        if (!hayCoincidencia) return false;
      }

      // Filtro de tipo
      if (roomType && room.type !== roomType) return false;

      // Filtro de ubicación
      if (roomLocation && room.location !== roomLocation) return false;

      // Filtro de fecha
      if (selectedDate && s.date !== selectedDate) return false;

      // Filtro de hora
      if (selectedTime && s.time !== selectedTime) return false;

      // Ocultar funciones pasadas
      const showtimeDateTime = new Date(`${s.date}T${s.time}`);
      const now = new Date();
      if (showtimeDateTime.getTime() <= now.getTime()) return false;

      return true;
    });
  }, [allShowtimes, rooms, debouncedSearch, roomType, roomLocation, selectedDate, selectedTime, isLoadingShowtimes, isLoadingRooms]);

  // 🔄 Opciones de filtros — SIEMPRE basadas en todas las salas y funciones, no en los resultados filtrados
  const availableRoomTypes = useMemo(() => {
    const set = new Set<string>();
    rooms.forEach((r) => {
      if (r.status === "active" && r.type) set.add(r.type);
    });
    return Array.from(set).sort();
  }, [rooms]);

  const availableLocations = useMemo(() => {
    const set = new Set<string>();
    rooms.forEach((r) => {
      if (r.status === "active" && r.location) set.add(r.location);
    });
    return Array.from(set).sort();
  }, [rooms]);

  const availableDates = useMemo(() => {
    const set = new Set<string>();
    // Se toman todas las fechas futuras disponibles (sin filtrar por ubicación)
    allShowtimes.forEach((s) => {
      const showtimeDateTime = new Date(`${s.date}T${s.time}`);
      const now = new Date();
      if (showtimeDateTime.getTime() > now.getTime()) {
        set.add(s.date);
      }
    });
    return Array.from(set).sort();
  }, [allShowtimes]);

  const availableTimes = useMemo(() => {
    const set = new Set<string>();
    // Mostrar todas las horas futuras disponibles
    allShowtimes.forEach((s) => {
      const showtimeDateTime = new Date(`${s.date}T${s.time}`);
      const now = new Date();
      if (showtimeDateTime.getTime() > now.getTime()) {
        set.add(s.time);
      }
    });
    return Array.from(set).sort();
  }, [allShowtimes]);


  // Función para manejar cambios en ubicación (PERMITE CAMBIAR DIRECTAMENTE ENTRE OPCIONES)
  const handleLocationChange = (location: string) => {
    setRoomLocation(location);
  };

  // Función para manejar cambios en tipo (PERMITE CAMBIAR DIRECTAMENTE ENTRE OPCIONES)
  const handleTypeChange = (type: string) => {
    setRoomType(type === "__all__" ? "" : type);
  };

  // Función para manejar cambios en fecha (NO afecta hora)
  const handleDateChange = (date: string) => {
    setSelectedDate(date === "__all__" ? "" : date);
    // NO limpiamos la hora seleccionada
  };

  // Función para manejar cambios en hora (INDEPENDIENTE de fecha)
  const handleTimeChange = (time: string) => {
    setSelectedTime(time === "__all__" ? "" : time);
  };

  const clearFilters = () => {
    setSearchRoom("");
    setRoomType("");
    setRoomLocation("");
    setSelectedDate("");
    setSelectedTime("");
  };

  // Loading principal
  if (!user || isLoadingMovie) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground text-lg">Cargando película...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (!movie) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <XCircle className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-4">Película no encontrada</h1>
          <p className="text-muted-foreground mb-6">
            La película que buscas no existe o no está disponible.
          </p>
          <Button asChild>
            <Link href="/cartelera">Volver a la cartelera</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="outline" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Poster */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden">
              <AspectRatio ratio={2 / 3}>
                <img
                  src={movie.poster || "/placeholder.svg"}
                  alt={movie.title}
                  className="object-cover w-full h-full"
                />
              </AspectRatio>
            </Card>
          </div>

          {/* Detalles + funciones */}
          <div className="lg:col-span-2 space-y-6">
            {/* Detalles de la película */}
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-4">{movie.title}</h1>

              <div className="flex flex-wrap items-center gap-4 mb-4">
                <Badge variant="secondary" className="text-sm">{movie.genre}</Badge>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{movie.rating}</span>
                  <span className="text-muted-foreground">/10</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{movie.duration} minutos</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{movie.releaseDate}</span>
                </div>
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed">{movie.description}</p>
            </div>

            {/* Filtros y funciones */}
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Filtrar funciones
                  </h3>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={clearFilters}
                  >
                    <XCircle className="h-4 w-4 mr-1" /> Limpiar
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* 📍 Ubicación - PRIMERO: Pestañas arriba de todo */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">Ubicación</label>
                    <div className="flex flex-wrap gap-2">
                      {/* Pestaña "Todas" */}
                      <Button
                        variant={roomLocation === "" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleLocationChange("")}
                        disabled={isLoadingRooms}
                        className="flex-1 sm:flex-none"
                      >
                        Todas
                      </Button>

                      {/* Pestañas de ubicaciones disponibles */}
                      {availableLocations.map((location) => (
                        <Button
                          key={location}
                          variant={roomLocation === location ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleLocationChange(location)}
                          disabled={isLoadingRooms}
                          className="flex-1 sm:flex-none"
                        >
                          {location}
                        </Button>
                      ))}

                      {/* Mensaje cuando no hay ubicaciones */}
                      {availableLocations.length === 0 && !isLoadingRooms && (
                        <div className="text-sm text-muted-foreground italic">
                          No hay ubicaciones disponibles
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 🔍 Demás filtros en la misma línea */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Búsqueda */}
                    <Input
                      placeholder="Buscar sala..."
                      value={searchRoom}
                      onChange={(e) => setSearchRoom(e.target.value)}
                      disabled={isLoadingRooms}
                    />

                    {/* 🏷 Tipo de sala */}
                    <Select
                      value={roomType || "__all__"}
                      onValueChange={handleTypeChange}
                      disabled={isLoadingRooms}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo de sala" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Todos</SelectItem>
                        {availableRoomTypes.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* 📅 Fecha */}
                    <Select
                      value={selectedDate || "__all__"}
                      onValueChange={handleDateChange}
                      disabled={isLoadingShowtimes}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Fecha" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Todas</SelectItem>
                        {availableDates.length === 0 ? (
                          <div className="px-2 py-1 text-muted-foreground text-sm">
                            {isLoadingShowtimes ? "Cargando..." : "Sin fechas"}
                          </div>
                        ) : (
                          availableDates.map((d) => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>

                    {/* ⏰ Hora - INDEPENDIENTE de fecha */}
                    <Select
                      value={selectedTime || "__all__"}
                      onValueChange={handleTimeChange}
                      disabled={isLoadingShowtimes || availableTimes.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          availableTimes.length === 0
                            ? "Sin horarios"
                            : "Hora"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Todas</SelectItem>
                        {availableTimes.length === 0 ? (
                          <div className="px-2 py-1 text-muted-foreground text-sm">
                            Sin horarios
                          </div>
                        ) : (
                          availableTimes.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t.slice(0, 5)} hrs
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Contador de resultados */}
                  <div className="flex items-center justify-end text-sm text-muted-foreground">
                    {isLoadingShowtimes || isLoadingRooms ? (
                      "Cargando..."
                    ) : (
                      `${filteredShowtimes.length} función${filteredShowtimes.length !== 1 ? 'es' : ''} encontrada${filteredShowtimes.length !== 1 ? 's' : ''}`
                    )}
                  </div>
                </div>

                {/* 🎞 Listado de funciones */}
                <div className="mt-4 space-y-4">
                  {isLoadingShowtimes || isLoadingRooms ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
                      <p className="text-muted-foreground">Cargando funciones disponibles...</p>
                    </div>
                  ) : filteredShowtimes.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No hay funciones disponibles con los filtros seleccionados.
                    </p>
                  ) : (
                    filteredShowtimes.map((s) => {
                      const room = rooms.find((r) => r.id === s.room_id);
                      return (
                        <div
                          key={s.id}
                          className="border p-4 rounded-lg flex justify-between items-center hover:bg-muted/50 transition-colors"
                        >
                          <div>
                            <p className="font-semibold">{room?.name ?? s.room?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {s.date} — {s.time} — {room?.type ?? "—"} — {room?.location ?? "—"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">Q{s.price}</p>
                            <Button size="sm" asChild>
                              <Link href={`/reservar/${s.id}`}>Comprar</Link>
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}