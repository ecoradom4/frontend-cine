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
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Star, Clock, Calendar, ArrowLeft, MapPin, XCircle } from "lucide-react";
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
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm:ss"
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
  const [isLoading, setIsLoading] = useState(true);

  // Filtros (progresivos)
  const [searchRoom, setSearchRoom] = useState("");
  const debouncedSearch = useDebouncedValue(searchRoom, 300);
  const [roomType, setRoomType] = useState<string>(""); // "" = todas
  const [roomLocation, setRoomLocation] = useState<string>(""); // "" = todas
  const [selectedDate, setSelectedDate] = useState<string>(""); // "YYYY-MM-DD"
  const [selectedTime, setSelectedTime] = useState<string>(""); // "HH:mm:ss"
  const [activeTab, setActiveTab] = useState<string>("todas"); // pestaña activa

  // 1) Película
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const data = await moviesApi.getMovieById(movieId);
        setMovie(data);
      } catch (err) {
        console.error("Error al cargar película:", err);
        setMovie(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [movieId]);

  // 2) Salas activas
  useEffect(() => {
    (async () => {
      try {
        const data = await roomsApi.getRooms({
          search: debouncedSearch || undefined,
          type: roomType || undefined,
          location: roomLocation || undefined,
          status: "active",
        });
        setRooms((data.rooms || []).filter((r: Room) => r.status === "active"));
      } catch (err) {
        console.error("Error al cargar salas:", err);
      }
    })();
  }, [debouncedSearch, roomType, roomLocation]);

  // 3) Showtimes
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const data = await showtimesApi.getShowtimes({ movieId });
        const list = (data.showtimes || []).sort((a: Showtime, b: Showtime) => {
          const aDate = new Date(`${a.date}T${a.time}`);
          const bDate = new Date(`${b.date}T${b.time}`);
          return aDate.getTime() - bDate.getTime();
        });
        setAllShowtimes(list);
      } catch (err) {
        console.error("Error al cargar funciones:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [movieId]);

  // 4) Filtrado progresivo
  const filteredShowtimes = useMemo(() => {
    const search = debouncedSearch.trim().toLowerCase();

    return allShowtimes.filter((s) => {
      const room = rooms.find((r) => r.id === s.room_id);
      if (!room) return false;

      if (search) {
        const match =
          room.name?.toLowerCase().includes(search) ||
          room.location?.toLowerCase().includes(search);
        if (!match) return false;
      }

      if (roomType && room.type !== roomType) return false;

      if (roomLocation && room.location !== roomLocation) return false;

      if (selectedDate && s.date !== selectedDate) return false;

      if (selectedTime && s.time !== selectedTime) return false;

      const showtimeDateTime = new Date(`${s.date}T${s.time}`);
      if (showtimeDateTime <= new Date()) return false;

      return true;
    });
  }, [allShowtimes, rooms, debouncedSearch, roomType, roomLocation, selectedDate, selectedTime]);

  // 5) Opciones para selects
  const availableRoomTypes = useMemo(() => {
    const set = new Set<string>();
    rooms.forEach((r) => {
      const hasAny = allShowtimes.some((s) => s.room_id === r.id);
      if (hasAny && r.type) set.add(r.type);
    });
    return Array.from(set).sort();
  }, [rooms, allShowtimes]);

  const availableLocations = useMemo(() => {
    const set = new Set<string>();
    rooms.forEach((r) => set.add(r.location));
    return Array.from(set).sort();
  }, [rooms]);

  const availableDates = useMemo(() => {
    const set = new Set<string>();
    filteredShowtimes.forEach((s) => set.add(s.date));
    return Array.from(set).sort();
  }, [filteredShowtimes]);

  const availableTimes = useMemo(() => {
    const set = new Set<string>();
    filteredShowtimes.forEach((s) => set.add(s.time));
    return Array.from(set).sort();
  }, [filteredShowtimes]);

  // 6) Efectos dependientes
  useEffect(() => {
    if (activeTab !== "todas") {
      setRoomLocation(activeTab);
    } else {
      setRoomLocation("");
    }
  }, [activeTab]);

  useEffect(() => {
    if (roomType && !availableRoomTypes.includes(roomType)) setRoomType("");
  }, [availableRoomTypes, roomType]);

  const clearFilters = () => {
    setSearchRoom("");
    setRoomType("");
    setRoomLocation("");
    setSelectedDate("");
    setSelectedTime("");
    setActiveTab("todas");
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-lg">Cargando película...</p>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Película no encontrada
          </h1>
          <Button asChild>
            <Link href="/cartelera">Volver a la cartelera</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ✅ UI principal
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

              <p className="text-lg text-muted-foreground leading-relaxed">
                {movie.description}
              </p>
            </div>

            {/* Filtros y pestañas */}
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

                {/* 🔹 Pestañas por ubicación */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="flex flex-wrap gap-2">
                    <TabsTrigger value="todas">Todas</TabsTrigger>
                    {availableLocations.map((loc) => (
                      <TabsTrigger key={loc} value={loc}>
                        {loc}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>

                {/* 🔍 Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <Input
                    placeholder="Buscar sala o ubicación..."
                    value={searchRoom}
                    onChange={(e) => setSearchRoom(e.target.value)}
                  />

                  <Select
                    value={roomType || "__all__"}
                    onValueChange={(v) => setRoomType(v === "__all__" ? "" : v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Tipo de sala" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todas</SelectItem>
                      {availableRoomTypes.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={roomLocation || "__all__"}
                    onValueChange={(v) => setRoomLocation(v === "__all__" ? "" : v)}
                    disabled={activeTab !== "todas"} // ✅ deshabilita si hay pestaña activa
                  >
                    <SelectTrigger><SelectValue placeholder="Ubicación" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todas</SelectItem>
                      {availableLocations.map((loc) => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedDate || "__all__"}
                    onValueChange={(v) => {
                      if (v === "__all__") {
                        setSelectedDate("");
                        setSelectedTime("");
                      } else {
                        setSelectedDate(v);
                        setSelectedTime("");
                      }
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Fecha" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todas</SelectItem>
                      {availableDates.length === 0 ? (
                        <div className="px-2 py-1 text-muted-foreground text-sm">Sin fechas</div>
                      ) : (
                        availableDates.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedTime || "__all__"}
                    onValueChange={(v) => setSelectedTime(v === "__all__" ? "" : v)}
                    disabled={!selectedDate || availableTimes.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedDate ? "Hora" : "Seleccione fecha"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todas</SelectItem>
                      {availableTimes.length === 0 ? (
                        <div className="px-2 py-1 text-muted-foreground text-sm">Sin horarios</div>
                      ) : (
                        availableTimes.map((t) => (
                          <SelectItem key={t} value={t}>{t.slice(0, 5)} hrs</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* 🎞 Listado de funciones */}
                <div className="mt-4 space-y-4">
                  {isLoading ? (
                    <p className="text-muted-foreground">Cargando funciones...</p>
                  ) : filteredShowtimes.length === 0 ? (
                    <p className="text-muted-foreground">
                      No hay funciones disponibles con los filtros seleccionados.
                    </p>
                  ) : (
                    filteredShowtimes.map((s) => {
                      const room = rooms.find((r) => r.id === s.room_id);
                      return (
                        <div
                          key={s.id}
                          className="border p-4 rounded-lg flex justify-between items-center"
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
