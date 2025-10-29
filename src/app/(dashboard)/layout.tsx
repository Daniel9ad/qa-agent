"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useAppDispatch, useAppSelector } from "@/hooks/use-store";
import { setProjects, setSelectedProject } from "@/lib/redux/features/projectSlice";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  const { projects, selectedProjectId } = useAppSelector((state) => state.project);
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
        
        // Guardar proyectos en Redux
        dispatch(setProjects(projectsList));
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

  const handleProjectChange = (projectId: string) => {
    // Actualizar el proyecto seleccionado en Redux
    dispatch(setSelectedProject(projectId));
  };

  if (loading) {
    return <LoadingScreen message="Cargando proyectos" />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A1612]">
      <Sidebar
        projects={projects}
        activeProjectId={selectedProjectId || ""}
        onProjectChange={handleProjectChange}
        onProjectCreated={fetchProjects}
      />
      <main className="flex-1 min-w-0 flex flex-col">
        {children}
      </main>
    </div>
  );
}
