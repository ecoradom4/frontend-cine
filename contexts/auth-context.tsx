"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { authApi, type User } from "@/services/auth-api"

export type UserRole = "cliente" | "admin"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }> // Remover role
  logout: () => void
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
          console.error('Failed to validate token:', error)
          // Token is invalid, clear storage
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
      
      setIsLoading(false)
      return { success: true }
    } catch (error: any) {
      console.error('Login error:', error)
      setIsLoading(false)
      return { 
        success: false, 
        message: error.message || 'Error al iniciar sesión' 
      }
    }
  }

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true)

    try {
      // Solo pasar name, email y password - el role se establece automáticamente en el servicio
      const authData = await authApi.register({ name, email, password })
      
      setUser(authData.user)
      localStorage.setItem("cine-connect-user", JSON.stringify(authData.user))
      localStorage.setItem("cine-connect-token", authData.token)
      
      setIsLoading(false)
      return { success: true }
    } catch (error: any) {
      console.error('Registration error:', error)
      setIsLoading(false)
      return { 
        success: false, 
        message: error.message || 'Error al registrar usuario' 
      }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("cine-connect-user")
    localStorage.removeItem("cine-connect-token")
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