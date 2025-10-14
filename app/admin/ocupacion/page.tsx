"use client"

import { OccupancyDashboard } from "@/components/admin/occupancy-dashboard"
import { RoleGuard } from "@/components/auth/role-guard"
import { Navbar } from "@/components/layout/navbar"

export default function AdminOccupancyPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <OccupancyDashboard />
        </main>
      </div>
    </RoleGuard>
  )
}
