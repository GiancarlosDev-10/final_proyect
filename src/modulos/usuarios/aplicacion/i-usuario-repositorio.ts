import { Usuario } from "@/modulos/usuarios/dominio/usuario";

export interface IUsuarioRepositorio {
  buscarPorId(id: string): Promise<Usuario | null>;
  buscarPorEmail(email: string): Promise<Usuario | null>;
  listar(): Promise<Usuario[]>;
  crear(usuario: Usuario): Promise<void>;
  actualizar(usuario: Usuario): Promise<void>;
}