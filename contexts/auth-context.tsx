"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { authApi, type User } from "@/services/auth-api"

export type UserRole = "cliente" | "admin"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => Promise<{ success: boolean; message?: string }>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("cine-connect-token")
      
      if (token) {
        try {
          const userData = await authApi.getProfile(token)
          setUser(userData)
        } catch (error) {
          console.error("Failed to validate token:", error)
          localStorage.removeItem("cine-connect-user")
          localStorage.removeItem("cine-connect-token")
        }
      }
      setIsLoading(false)
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true)
    try {
      const authData = await authApi.login({ email, password })
      setUser(authData.user)
      localStorage.setItem("cine-connect-user", JSON.stringify(authData.user))
      localStorage.setItem("cine-connect-token", authData.token)
      return { success: true }
    } catch (error: any) {
      console.error("Login error:", error)
      return { success: false, message: error.message || "Error al iniciar sesión" }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true)
    try {
      const authData = await authApi.register({ name, email, password })
      setUser(authData.user)
      localStorage.setItem("cine-connect-user", JSON.stringify(authData.user))
      localStorage.setItem("cine-connect-token", authData.token)
      return { success: true }
    } catch (error: any) {
      console.error("Registration error:", error)
      return { success: false, message: error.message || "Error al registrar usuario" }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 🔒 Logout con llamada al backend
   */
  const logout = async (): Promise<{ success: boolean; message?: string }> => {
    const token = localStorage.getItem("cine-connect-token")

    try {
      if (token) {
        const result = await authApi.logout(token)
        console.log("Logout API response:", result)
      }
    } catch (error: any) {
      console.warn("Logout error:", error)
    } finally {
      // Limpieza local garantizada
      localStorage.removeItem("cine-connect-user")
      localStorage.removeItem("cine-connect-token")
      setUser(null)
    }

    return { success: true, message: "Sesión cerrada exitosamente" }
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
