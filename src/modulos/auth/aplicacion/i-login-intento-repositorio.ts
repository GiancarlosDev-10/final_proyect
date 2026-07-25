import { LoginIntento } from "@/modulos/auth/dominio/login-intento";

export interface ILoginIntentoRepositorio {
  buscarPorEmail(email: string): Promise<LoginIntento | null>;
  guardar(intento: LoginIntento): Promise<void>;
  eliminar(email: string): Promise<void>;
}
