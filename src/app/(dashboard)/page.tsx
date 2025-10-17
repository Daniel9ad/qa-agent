"use client";

import { Calendar } from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Button } from "@/components/ui/button";

// Mock data - replace with real data later
const mockStats = {
  totalTests: 847,
  testsChange: { value: "12% vs ayer", isPositive: true },
  successRate: "94.2%",
  successRateChange: { value: "2.1% vs ayer", isPositive: true },
  avgDuration: "2.3s",
  avgDurationChange: { value: "0.2s vs ayer", isPositive: false },
  activeFlows: 8,
  totalFlows: 8,
};

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Header Bar */}
      <div className="bg-[#0F1E19] h-[72px] flex items-center justify-between px-10">
        <h1 className="text-2xl font-semibold text-[#E5F5ED]">
          Dashboard - miapp.com
        </h1>
        
        <Button
          variant="outline"
          className="bg-[#1A2E26] border-[#2E4A3D] text-[#9CA8A3] hover:bg-[#1F3D32] hover:text-[#E5F5ED]"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Últimos 7 días
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-10 overflow-auto">
        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
          <StatsCard
            title="Total de Pruebas"
            value={mockStats.totalTests}
            change={mockStats.testsChange}
          />
          
          <StatsCard
            title="Tasa de Éxito"
            value={mockStats.successRate}
            change={mockStats.successRateChange}
          />
          
          <StatsCard
            title="Tiempo Promedio"
            value={mockStats.avgDuration}
            change={mockStats.avgDurationChange}
          />
          
          <StatsCard
            title="Flujos Activos"
            value={mockStats.activeFlows}
            subtitle={`de ${mockStats.totalFlows} configurados`}
          />
        </div>

        {/* Placeholder for future content */}
        <div className="bg-[#0F1E19] rounded-xl p-6 text-center text-[#6B7F77]">
          <p className="text-sm">
            Más secciones del dashboard se agregarán próximamente...
          </p>
        </div>
      </div>
    </div>
  );
}
