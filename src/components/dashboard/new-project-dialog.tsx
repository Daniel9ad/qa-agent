"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NewProjectDialogProps {
  onProjectCreated?: () => void;
}

export function NewProjectDialog({ onProjectCreated }: NewProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    url: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Error al crear el proyecto");
        setLoading(false);
        return;
      }

      // Resetear formulario
      setFormData({ name: "", url: "" });
      setOpen(false);
      
      // Llamar callback para refrescar la lista
      if (onProjectCreated) {
        onProjectCreated();
      }
    } catch (err) {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full border-[#2E4A3D] border-dashed text-[#4ADE80] bg-transparent hover:bg-[#1F3D32] hover:text-[#4ADE80]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Proyecto
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0F1E19] border-[#2E4A3D] text-[#E5F5ED]">
        <DialogHeader>
          <DialogTitle className="text-xl text-[#E5F5ED]">
            Crear Nuevo Proyecto
          </DialogTitle>
          <DialogDescription className="text-[#9CA8A3]">
            Agrega un nuevo proyecto para comenzar a realizar pruebas automatizadas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[#E5F5ED]">
              Nombre del Proyecto
            </Label>
            <Input
              id="name"
              placeholder="Ej: Mi App"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              className="bg-[#1A2E26] border-[#2E4A3D] text-[#E5F5ED] placeholder:text-[#6B7F77]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url" className="text-[#E5F5ED]">
              URL del Proyecto
            </Label>
            <Input
              id="url"
              type="url"
              placeholder="https://miapp.com"
              value={formData.url}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
              required
              className="bg-[#1A2E26] border-[#2E4A3D] text-[#E5F5ED] placeholder:text-[#6B7F77]"
            />
          </div>

          {error && (
            <div className="bg-[#DE5454]/10 border border-[#DE5454] rounded-md p-3">
              <p className="text-sm text-[#DE5454]">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="bg-transparent border-[#2E4A3D] text-[#9CA8A3] hover:bg-[#1A2E26]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#4ADE80] text-[#0A1612] hover:bg-[#3BC66D] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Spinner size="sm" color="dark" />
                  <span>Creando...</span>
                </>
              ) : (
                "Crear Proyecto"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
