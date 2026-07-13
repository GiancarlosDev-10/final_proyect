import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { UsuarioRepositorioMongo } from "@/modulos/usuarios/infraestructura/usuario-repositorio-mongo";
import { iniciarSesion } from "@/modulos/auth/aplicacion/iniciar-sesion";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const repositorio = new UsuarioRepositorioMongo();
        const resultado = await iniciarSesion(
          credentials.email as string,
          credentials.password as string,
          repositorio
        );
        if (!resultado.ok) return null;
        const usuario = resultado.value;
        return {
          id: usuario.id,
          email: usuario.email,
          name: usuario.nombreCompleto,
          rol: usuario.rol,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // Se re-ejecuta en cada auth()/getSession(), no solo al iniciar sesión: si un
    // admin desactiva a un profesor con la sesión ya abierta, esto lo desconecta
    // en el siguiente request en vez de esperar a que la cookie expire.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rol = (user as any).rol;
        return token;
      }
      if (token.id) {
        const repositorio = new UsuarioRepositorioMongo();
        const usuarioActual = await repositorio.buscarPorId(token.id as string);
        if (!usuarioActual || !usuarioActual.activo) {
          return null;
        }
        token.rol = usuarioActual.rol;
      }
      return token;
    },
  },
});