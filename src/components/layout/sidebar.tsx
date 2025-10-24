"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { LayoutDashboard, FileText, GitBranch, BarChart3, LogOut } from "lucide-react";
import { NewProjectDialog } from "@/components/dashboard/new-project-dialog";
import { Button } from "@/components/ui/button";
import type { Project } from "@/types";

interface SidebarProps {
  projects: Project[];
  activeProjectId: string;
  onProjectChange: (projectId: string) => void;
  onProjectCreated: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard", path: "/" },
  { icon: FileText, label: "Contexto de Vistas", id: "context", path: "/context" },
  { icon: GitBranch, label: "Flujos de Prueba", id: "flows", path: "/flows" },
  { icon: BarChart3, label: "Resultados", id: "results", path: "/results" },
];

export function Sidebar({ projects, activeProjectId, onProjectChange, onProjectCreated }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeNav, setActiveNav] = useState("dashboard");

  const handleNavClick = (item: typeof navItems[0]) => {
    setActiveNav(item.id);
    router.push(item.path);
  };

  return (
    <div className="w-[280px] h-screen bg-[#0F1E19] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-5">
        <div className="bg-[#1A2E26] rounded-lg p-3 flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="QA Agent"
            width={120}
            height={40}
            priority
            className="object-contain"
          />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 space-y-6">
        {/* Projects Section */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-[#6B7F77] uppercase tracking-widest">
            Proyectos
          </h2>

          <div className="space-y-2">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => onProjectChange(project.id)}
                className={`w-full rounded-md p-3 flex items-start gap-3 transition-colors ${
                  project.id === activeProjectId
                    ? "bg-[#1F3D32]"
                    : "bg-transparent hover:bg[#0F1E19]"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full mt-0.5 ${
                    project.id === activeProjectId
                      ? "bg-[#4ADE80]"
                      : "bg-[#2E4A3D]"
                  }`}
                />
                <div className="flex-1 text-left">
                  <p
                    className={`text-sm font-medium ${
                      project.id === activeProjectId
                        ? "text-[#E5F5ED]"
                        : "text-[#9CA8A3]"
                    }`}
                  >
                    {project.name}
                  </p>
                  <p className="text-xs text-[#6B7F77]">
                    {project.viewsCount} vistas • {project.flowsCount} flujos
                  </p>
                </div>
              </button>
            ))}
          </div>

          <NewProjectDialog onProjectCreated={onProjectCreated} />
        </div>

        {/* Navigation Section */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-[#6B7F77] uppercase tracking-widest">
            Navegación
          </h2>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`w-full rounded-md p-3 flex items-center gap-3 transition-colors relative ${
                    isActive
                      ? "bg-[#1F3D32] text-[#E5F5ED]"
                      : "text-[#9CA8A3] hover:bg-[#1A2E26]"
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#4ADE80] rounded-full" />
                  )}
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Logout Section - Fixed at bottom */}
      <div className="p-5 border-t border-[#2E4A3D]">
        <Button
          onClick={() => signOut({ callbackUrl: "/login" })}
          variant="outline"
          className="w-full border-[#2E4A3D] text-[#9CA8A3] bg-transparent hover:bg-[#1A2E26] hover:text-[#E5F5ED] hover:border-[#DE5454] transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}
