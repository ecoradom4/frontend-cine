"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar, TrendingUp, DollarSign, Users, Film, Download } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  LabelList,
  ComposedChart,
  Legend,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"

import { dashboardApi, DashboardStats, SalesByMovie, DailyTrend, GenreDistribution } from "@/services/dashboard-api"

// 🔸 Tipos locales adaptados a Recharts
interface ChartMovieData {
  name: string
  ventas: number
  boletos: number
}

// 🔸 Corregir la interfaz para PieChart - debe tener index signature
interface ChartGenreData extends GenreDistribution {
  color: string
  [key: string]: string | number // Index signature para compatibilidad con Recharts
}

export function SalesDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("semana")
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<"excel" | "pdf">("excel")

  const [salesByMovie, setSalesByMovie] = useState<ChartMovieData[]>([])
  const [dailyTrends, setDailyTrends] = useState<DailyTrend[]>([])
  const [genreDistribution, setGenreDistribution] = useState<ChartGenreData[]>([])
  const [loading, setLoading] = useState(false)

  // 🗓️ Mapeo de periodos
  const periodMap: Record<string, string> = {
    dia: "day",
    semana: "week",
    mes: "month",
    año: "year",
  }

  // 🎨 Colores dinámicos del tema - Asegurar que se usen correctamente
  const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ]

  const loadDashboardData = async (period: string) => {
    try {
      setLoading(true)
      const apiPeriod = periodMap[period] || "week"

      const [statsRes, salesRes, trendsRes, genresRes] = await Promise.all([
        dashboardApi.getStats(apiPeriod),
        dashboardApi.getSalesByMovie(apiPeriod),
        dashboardApi.getDailyTrends(apiPeriod),
        dashboardApi.getGenreDistribution(apiPeriod),
      ])

      setStats(statsRes)

      setSalesByMovie(
        salesRes.map((item) => ({
          name: item.movieTitle,
          ventas: item.totalSales,
          boletos: item.ticketCount,
        }))
      )

      setDailyTrends(
        trendsRes.map((t) => ({
          ...t,
          boletos: Number(t.boletos) || 0,
        }))
      )

      setGenreDistribution(
        genresRes.map((g, i) => ({
          ...g,
          color: COLORS[i % COLORS.length],
        }))
      )
    } catch (error) {
      console.error("Error al cargar datos del dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportReport = async () => {
    try {
      setExporting(true)
      
      const apiPeriod = periodMap[selectedPeriod] || "week"
      
      // Usar el nuevo método del servicio
      await dashboardApi.downloadReport({
        period: apiPeriod,
        format: exportFormat
      })

      // Opcional: Aquí podrías agregar un toast de éxito
      console.log(`Reporte exportado exitosamente en formato ${exportFormat.toUpperCase()}`)

    } catch (error) {
      console.error('Error exportando reporte:', error)
      // Mostrar mensaje de error al usuario
      alert('Error al exportar el reporte: ' + (error as Error).message)
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    loadDashboardData(selectedPeriod)
  }, [selectedPeriod])

  if (loading) {
    return <div className="text-center text-muted-foreground py-10 animate-pulse">Cargando datos...</div>
  }

  return (
    <div className="space-y-6 min-h-screen bg-gradient-to-b from-background via-muted/30 to-background p-4 md:p-8 rounded-xl">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
            Dashboard de Ventas
          </h1>
          <p className="text-muted-foreground">Análisis de ventas y tendencias</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40 border-primary/30 focus:ring-primary">
              <SelectValue placeholder="Selecciona periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dia">Hoy</SelectItem>
              <SelectItem value="semana">Esta semana</SelectItem>
              <SelectItem value="mes">Este mes</SelectItem>
              <SelectItem value="año">Este año</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Selector de formato de exportación */}
          <Select value={exportFormat} onValueChange={(value: "excel" | "pdf") => setExportFormat(value)}>
            <SelectTrigger className="w-32 border-primary/30 focus:ring-primary">
              <SelectValue placeholder="Formato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>

          {/* Botón de exportar */}
          <Button 
            variant="outline" 
            className="border-primary/30 hover:bg-primary/10 transition-all"
            onClick={handleExportReport}
            disabled={exporting || loading}
          >
            {exporting ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar {exportFormat.toUpperCase()}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Ventas Totales */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/30 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
              <DollarSign className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">
                Q{stats.totalSales.toLocaleString("es-GT")}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500">
                  +{stats.salesGrowth?.toFixed(1) ?? 0}%
                </span>{" "}
                vs periodo anterior
              </p>
            </CardContent>
          </Card>

          {/* Boletos */}
          <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Boletos Vendidos</CardTitle>
              <Users className="h-5 w-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-500">
                {stats.totalTickets.toLocaleString("es-GT")}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500">+8.2%</span> vs periodo anterior
              </p>
            </CardContent>
          </Card>

          {/* Precio Promedio */}
          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Precio Promedio</CardTitle>
              <TrendingUp className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-500">
                Q{stats.averagePrice.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Promedio por boleto</p>
            </CardContent>
          </Card>

          {/* Películas activas */}
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Películas Activas</CardTitle>
              <Film className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-500">{stats.activeMovies}</div>
              <p className="text-xs text-muted-foreground">En cartelera actual</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* --- Gráficos --- */}

      {/* 📊 Ventas por película */}
      <Card className="bg-card/70 border-border/40 shadow-md hover:shadow-lg transition-all">
        <CardHeader>
          <CardTitle className="text-foreground">Ventas por Película</CardTitle>
          <CardDescription className="text-muted-foreground">
            Rendimiento de películas en el período seleccionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart
              data={salesByMovie}
              margin={{ top: 40, right: 20, left: 10, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                interval={0}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                angle={-25}
                textAnchor="end"
                height={80}
                tickFormatter={(name) =>
                  name.length > 18 ? name.substring(0, 16) + "…" : name
                }
              />
              <YAxis
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => `Q${v / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(59, 130, 246,0.95)",
                  border: "1px solid rgb(var(--chart-1))",
                  borderRadius: "10px",
                  color: "white",
                }}
                formatter={(v: number) => `Q${v.toLocaleString("es-GT")}`}
              />
              <Bar
                dataKey="ventas"
                radius={[8, 8, 0, 0]}
                isAnimationActive={true}
                animationDuration={800}
              >
                {salesByMovie.map((_, i) => (
                  <Cell
                    key={`cell-${i}`}
                    fill={`rgb(var(--chart-${(i % 5) + 1}))`}
                  />
                ))}
                <LabelList
                  dataKey="ventas"
                  position="top"
                  style={{
                    fill: "hsl(var(--foreground))",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                  formatter={(label: any) => {
                    const value = Number(label)
                    return !isNaN(value) ? `Q${(value / 1000).toFixed(1)}k` : ""
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 📈 Tendencia diaria */}
      <Card className="bg-card/70 border-border/40 shadow-md hover:shadow-lg transition-all">
        <CardHeader>
          <CardTitle>Tendencia Acumulada</CardTitle>
          <CardDescription>Evolución total de ventas en el período</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={dailyTrends}>
              <defs>
                <linearGradient id="gradientVentas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[2]} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={COLORS[2]} stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="fecha"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => `Q${v / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                formatter={(v: number) => [`Q${v.toLocaleString("es-GT")}`, "Ventas"]}
              />
              <Area
                type="monotone"
                dataKey="ventas"
                stroke={COLORS[2]}
                fill="url(#gradientVentas)"
                strokeWidth={3}
                name="Ventas"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 🥧 Distribución por género */}
      <Card className="bg-card/70 border-border/40 shadow-md hover:shadow-lg transition-all">
        <CardHeader>
          <CardTitle>Distribución por Género</CardTitle>
          <CardDescription>Preferencias del público por género</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={genreDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                    labelLine={false}
                  >
                    {genreDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Porcentaje"]}
                    contentStyle={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {genreDistribution.map((genre, index) => (
                <div key={genre.name} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm font-medium">{genre.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {genre.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 🔀 Relación Ventas / Boletos */}
      <Card className="bg-card/70 border-border/40 shadow-md hover:shadow-lg transition-all">
        <CardHeader>
          <CardTitle>Relación Ventas / Boletos</CardTitle>
          <CardDescription>Comparación de ingresos y número de entradas por película</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={360}>
            <ComposedChart data={salesByMovie}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                angle={-25}
                textAnchor="end"
                height={80}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(name) =>
                  name.length > 18 ? name.substring(0, 16) + "…" : name
                }
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => `Q${v / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                formatter={(value: number, name: string) => {
                  if (name === "Ventas") return [`Q${value.toLocaleString("es-GT")}`, name]
                  return [value.toLocaleString("es-GT"), name]
                }}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="boletos"
                barSize={30}
                fill={COLORS[1]}
                name="Boletos"
                radius={[6, 6, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="ventas"
                stroke={COLORS[0]}
                strokeWidth={3}
                name="Ventas"
                dot={{ r: 4, fill: COLORS[0] }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ⭐ Popularidad por Género */}
      <Card className="bg-card/70 border-border/40 shadow-md hover:shadow-lg transition-all">
        <CardHeader>
          <CardTitle>Popularidad por Género</CardTitle>
          <CardDescription>Proporción de ventas por género en el período</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={genreDistribution}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis
                dataKey="name"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <Radar
                dataKey="value"
                stroke={COLORS[3]}
                fill={COLORS[3]}
                fillOpacity={0.5}
                name="Porcentaje"
              />
              <Tooltip
                formatter={(value) => [`${value}%`, "Popularidad"]}
                contentStyle={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                }}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 📉 Tendencia de Boletos */}
      <Card className="bg-card/70 border-border/40 shadow-md hover:shadow-lg transition-all">
        <CardHeader>
          <CardTitle>Tendencia de Boletos Vendidos</CardTitle>
          <CardDescription>
            Evolución de boletos vendidos durante el período seleccionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyTrends.filter((d) => Number(d.boletos) > 0)}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="fecha"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                formatter={(v: number) => [`${v}`, "Boletos"]}
              />
              <Line
                type="monotone"
                dataKey="boletos"
                stroke={COLORS[2]}
                strokeWidth={3}
                dot={{ fill: COLORS[2], r: 4 }}
                name="Boletos"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}