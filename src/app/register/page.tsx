"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    user: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validación de contraseñas
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: formData.user,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Error al registrar usuario");
        setLoading(false);
        return;
      }

      // Registro exitoso, redirigir al login
      router.push("/login?registered=true");
    } catch (err) {
      setError("Error de conexión. Intenta de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1612] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-[150px] left-[200px] w-[240px] h-[240px] rounded-full bg-[#0F1E19] opacity-50" />
      <div className="absolute bottom-[200px] right-[140px] w-[300px] h-[300px] rounded-full bg-[#0F1E19] opacity-30" />

      {/* Register container */}
      <div className="w-full max-w-md bg-[#0F1E19] rounded-2xl p-12 relative z-10">
        {/* Logo */}
        <div className="bg-[#1A2E26] rounded-lg p-4 flex items-center justify-center mb-8">
          <Image
            src="/logo.png"
            alt="QA Agent"
            width={150}
            height={50}
            priority
            className="object-contain"
          />
        </div>

        {/* Welcome text */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-[#E5F5ED] mb-2">
            Crear Cuenta
          </h2>
          <p className="text-sm text-[#6B7F77]">
            Completa los datos para registrarte
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="user"
              className="text-xs font-semibold text-[#9CA8A3] uppercase tracking-wider"
            >
              Usuario
            </Label>
            <Input
              id="user"
              type="text"
              placeholder="usuario"
              value={formData.user}
              onChange={(e) =>
                setFormData({ ...formData, user: e.target.value })
              }
              className="bg-[#1A2E26] border-[#2E4A3D] border-[1.5px] text-[#E5F5ED] placeholder:text-[#6B7F77] h-12 focus:border-[#4ADE80] focus:ring-[#4ADE80]"
              required
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="firstName"
                className="text-xs font-semibold text-[#9CA8A3] uppercase tracking-wider"
              >
                Nombre
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Juan"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="bg-[#1A2E26] border-[#2E4A3D] border-[1.5px] text-[#E5F5ED] placeholder:text-[#6B7F77] h-12 focus:border-[#4ADE80] focus:ring-[#4ADE80]"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="lastName"
                className="text-xs font-semibold text-[#9CA8A3] uppercase tracking-wider"
              >
                Apellido
              </Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Pérez"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="bg-[#1A2E26] border-[#2E4A3D] border-[1.5px] text-[#E5F5ED] placeholder:text-[#6B7F77] h-12 focus:border-[#4ADE80] focus:ring-[#4ADE80]"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-xs font-semibold text-[#9CA8A3] uppercase tracking-wider"
            >
              Contraseña
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="bg-[#1A2E26] border-[#2E4A3D] border-[1.5px] text-[#E5F5ED] placeholder:text-[#6B7F77] h-12 focus:border-[#4ADE80] focus:ring-[#4ADE80]"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="text-xs font-semibold text-[#9CA8A3] uppercase tracking-wider"
            >
              Confirmar Contraseña
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              className="bg-[#1A2E26] border-[#2E4A3D] border-[1.5px] text-[#E5F5ED] placeholder:text-[#6B7F77] h-12 focus:border-[#4ADE80] focus:ring-[#4ADE80]"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-[#DE5454]/10 border border-[#DE5454] rounded-md p-3">
              <p className="text-sm text-[#DE5454]">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-[#4ADE80] hover:bg-[#3bc770] text-[#0A1612] font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Spinner size="sm" color="dark" />
                <span>Creando cuenta...</span>
              </>
            ) : (
              "Crear Cuenta"
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="my-8 border-t border-[#2E4A3D]" />

        {/* Login link */}
        <div className="text-center space-y-2">
          <p className="text-sm text-[#9CA8A3]">¿Ya tienes cuenta?</p>
          <a
            href="/login"
            className="text-sm font-semibold text-[#4ADE80] hover:underline cursor-pointer block"
          >
            Iniciar Sesión
          </a>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#6B7F77] mt-8">
          © 2024 QA Agent. Automatización inteligente de pruebas.
        </p>
      </div>
    </div>
  );
}
