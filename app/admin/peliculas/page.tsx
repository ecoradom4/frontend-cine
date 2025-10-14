"use client"

import { MovieManagement } from "@/components/admin/movie-management"
import { RoleGuard } from "@/components/auth/role-guard"
import { Navbar } from "@/components/layout/navbar"

export default function AdminMoviesPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <MovieManagement />
        </main>
      </div>
    </RoleGuard>
  )
}
