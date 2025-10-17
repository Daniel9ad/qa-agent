import NextAuth from "next-auth";

import authConfig from "@/auth/auth.config";
import {
  API_AUTH_PREFIX,
  AUTH_ROUTES,
  DEFAULT_LOGIN_REDIRECT,
  PUBLIC_ROUTES
} from "@/routes";

const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
  console.log("------ middleware: ", req.url);

  if (req.headers.get("accept") === "text/x-component") {
    return;
  }

  const { nextUrl } = req;

  const isLoggedIn = !!req.auth;
  const isApiAuthRoute = nextUrl.pathname.startsWith(API_AUTH_PREFIX);
  const isAuthRoute = AUTH_ROUTES.includes(nextUrl.pathname);
  const isPublicRoute = PUBLIC_ROUTES.some(route =>
    typeof route === 'string'
      ? route === nextUrl.pathname
      : route.test(nextUrl.pathname)
  );

  // Permitir rutas de API de autenticación
  if (isApiAuthRoute) {
    return;
  }

  // Para usuarios logueados
  if (isLoggedIn) {
    // Si intenta acceder a una ruta de autenticación, redirigir a la página principal
    if (isAuthRoute) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }

    // Para todas las demás rutas, permitir el acceso
    return;
  }

  // Para usuarios no logueados
  if (!isLoggedIn) {
    // Si intenta acceder a una ruta que no es pública y no es auth, redirigir a login
    if (!isPublicRoute && !isAuthRoute) {
      return Response.redirect(new URL("/login", nextUrl));
    }
    // Para rutas públicas o de autenticación, permitir el acceso
    return;
  }

  // Permitir todas las demás solicitudes
  return;
});

export const config = {
  matcher: ['/((?!_next/|.*\\..*).*)'],
};