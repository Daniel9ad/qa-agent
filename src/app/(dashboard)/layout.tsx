"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { LoadingScreen } from "@/components/ui/loading-screen";
import type { Project } from "@/types";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      const data = await response.json();
      
      if (data.success && data.data) {
        const projectsList = data.data.map((p: any) => ({
          id: p._id,
          name: p.name,
          url: p.url,
          viewsCount: p.viewsCount,
          flowsCount: p.flowsCount,
          isActive: p.isActive,
        }));
        
        setProjects(projectsList);
        
        // Establecer el primer proyecto como activo si no hay uno activo
        if (projectsList.length > 0 && !activeProjectId) {
          setActiveProjectId(projectsList[0].id);
        }
      }
    } catch (error) {
      console.error("Error al cargar proyectos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  if (loading) {
    return <LoadingScreen message="Cargando proyectos" />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A1612]">
      <Sidebar
        projects={projects}
        activeProjectId={activeProjectId}
        onProjectChange={setActiveProjectId}
        onProjectCreated={fetchProjects}
      />
      <main className="flex-1 min-w-0 flex flex-col">
        {children}
      </main>
    </div>
  );
}
