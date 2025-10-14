"use client"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut, User, Film, BarChart3, Settings, Calendar, Clapperboard } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function Navbar() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/auth")
  }

  if (!user) return null

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Film className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-primary">Cine Connect</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            {user.role === "admin" ? (
              <>
                <Link
                  href="/admin/dashboard"
                  className="flex items-center space-x-1 text-foreground hover:text-primary transition-colors"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Dashboard Ventas</span>
                </Link>
                <Link
                  href="/admin/ocupacion"
                  className="flex items-center space-x-1 text-foreground hover:text-primary transition-colors"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Ocupación</span>
                </Link>
                <Link
                  href="/admin/peliculas"
                  className="flex items-center space-x-1 text-foreground hover:text-primary transition-colors"
                >
                  <Film className="h-4 w-4" />
                  <span>Películas</span>
                </Link>
                <Link
                  href="/admin/salas"
                  className="flex items-center space-x-1 text-foreground hover:text-primary transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>Salas</span>
                </Link>
                <Link
                  href="/admin/funciones"
                  className="flex items-center space-x-1 text-foreground hover:text-primary transition-colors"
                >
                  <Clapperboard className="h-4 w-4" />
                  <span>Funciones</span>
                </Link>
                <Link href="/cartelera" className="text-foreground hover:text-primary transition-colors">
                  Cartelera
                </Link>
              </>
            ) : (
              <>
                <Link href="/cartelera" className="text-foreground hover:text-primary transition-colors">
                  Cartelera
                </Link>
                <Link
                  href="/perfil"
                  className="flex items-center space-x-1 text-foreground hover:text-primary transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>Mi Perfil</span>
                </Link>
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Hola, {user.name}
              {user.role === "admin" && (
                <span className="ml-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">Admin</span>
              )}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
