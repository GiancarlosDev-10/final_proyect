import { DefaultSession } from "next-auth";
import { Rol } from "@/config/constantes";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      rol: Rol;
    } & DefaultSession["user"];
  }

  interface JWT {
    id: string;
    rol: Rol;
  }
}