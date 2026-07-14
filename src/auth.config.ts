import type { NextAuthConfig } from "next-auth";

const TREINTA_MINUTOS = 30 * 60;

export const authConfig = {
  pages: {
    signIn: "/auth/login",
  },
  // Sesión de tipo "sliding": cada request dentro de los 30 min renueva la
  // cookie: si el usuario está inactivo 30 min, el JWT vence y se le trata
  // como no autenticado (middleware/requerirSesion lo mandan al login).
  session: {
    strategy: "jwt",
    maxAge: TREINTA_MINUTOS,
    updateAge: 5 * 60,
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rol = (user as any).rol;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).rol = token.rol;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;