import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export default {
  providers: [
    Credentials({
      credentials: {
        user: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.user || !credentials?.password) {
          return null;
        }

        try {
          const response = await fetch("http://localhost:3000/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(credentials),
          });
          
          const data = await response.json();
          console.log("data", data);
          
          if (!data.data) {
            return null;
          }

          return {
            id: data.data.id,
            user: data.data.user,
            firstName: data.data.firstName,
            lastName: data.data.lastName,
          };
        } catch (error) {
          console.error("Error en authorize:", error);
          return null;
        }
      }
    })
  ]
} satisfies NextAuthConfig
