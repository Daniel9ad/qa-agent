"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        user,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Usuario o contraseña incorrectos");
      } else if (result?.ok) {
        router.push("/");
      }
    } catch (err) {
      setError("Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1612] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-[150px] left-[200px] w-[240px] h-[240px] rounded-full bg-[#0F1E19] opacity-50" />
      <div className="absolute bottom-[200px] right-[140px] w-[300px] h-[300px] rounded-full bg-[#0F1E19] opacity-30" />

      {/* Login container */}
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
            Iniciar Sesión
          </h2>
          <p className="text-sm text-[#6B7F77]">
            Ingresa tus credenciales para continuar
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
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
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="bg-[#1A2E26] border-[#2E4A3D] border-[1.5px] text-[#E5F5ED] placeholder:text-[#6B7F77] h-12 focus:border-[#4ADE80] focus:ring-[#4ADE80]"
              required
              disabled={loading}
            />
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
                <span>Iniciando sesión...</span>
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="my-8 border-t border-[#2E4A3D]" />

        {/* Sign up link */}
        <div className="text-center space-y-2">
          <p className="text-sm text-[#9CA8A3]">¿No tienes cuenta?</p>
          <a
            href="/register"
            className="text-sm font-semibold text-[#4ADE80] hover:underline cursor-pointer block"
          >
            Crear cuenta nueva
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
