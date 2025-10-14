"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: ("admin" | "cliente")[]
  fallbackPath?: string
  showUnauthorized?: boolean
}

export function RoleGuard({
  children,
  allowedRoles,
  fallbackPath = "/cartelera",
  showUnauthorized = true,
}: RoleGuardProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/auth")
        return
      }

      if (!allowedRoles.includes(user.role)) {
        if (!showUnauthorized) {
          router.push(fallbackPath)
        }
      }
    }
  }, [user, isLoading, allowedRoles, fallbackPath, showUnauthorized, router])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    )
  }

  // Redirect to auth if no user
  if (!user) {
    return null
  }

  // Show unauthorized message if user doesn't have required role
  if (!allowedRoles.includes(user.role)) {
    if (!showUnauthorized) {
      return null
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20">
              <Shield className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-xl">Acceso Denegado</CardTitle>
            <CardDescription>
              No tienes permisos para acceder a esta sección. Esta área está reservada para administradores.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              <p>
                Tu rol actual: <span className="font-medium capitalize">{user.role}</span>
              </p>
              <p>
                Roles requeridos: <span className="font-medium">{allowedRoles.join(", ")}</span>
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href={fallbackPath}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a la Cartelera
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/perfil">Ver Mi Perfil</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // User has required role, render children
  return <>{children}</>
}
