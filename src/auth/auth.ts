import NextAuth from "next-auth";
import authConfig from "@/auth/auth.config";

export const {
  handlers: { GET, POST },
  auth,
  unstable_update,
  signIn,
  signOut
} = NextAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Al hacer signIn, user contiene los datos retornados por authorize
      if (user) {
        token.id = user.id;
        token.user = user.user;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
      }
      return token;
    },
    async session({ session, token }) {
      // Pasar datos del token a la session
      if (token) {
        session.user = {
          id: token.id as string,
          user: token.user as string,
          firstName: token.firstName as string,
          lastName: token.lastName as string,
          email: "",
          emailVerified: null,
        };
      }
      return session;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  trustHost: true,
  ...authConfig
})
