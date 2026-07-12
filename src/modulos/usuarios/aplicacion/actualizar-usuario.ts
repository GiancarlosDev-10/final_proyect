import { IUsuarioRepositorio } from "@/modulos/usuarios/aplicacion/i-usuario-repositorio";
import { Usuario, UsuarioNoEncontradoError, EmailDuplicadoError } from "@/modulos/usuarios/dominio/usuario";
import { Result, ok, err } from "@/compartido/lib/result";
import { Rol } from "@/config/constantes";

export interface ActualizarUsuarioDTO {
  id: string;
  email: string;
  nombreCompleto: string;
  rol: Rol;
  activo: boolean;
}

export async function actualizarUsuario(
  datos: ActualizarUsuarioDTO,
  repositorio: IUsuarioRepositorio
): Promise<Result<Usuario>> {
  const usuario = await repositorio.buscarPorId(datos.id);
  if (!usuario) return err(new UsuarioNoEncontradoError(datos.id));

  if (datos.email !== usuario.email) {
    const existe = await repositorio.buscarPorEmail(datos.email);
    if (existe) return err(new EmailDuplicadoError(datos.email));
  }

  const ahora = new Date().toISOString();

  const usuarioActualizado = new Usuario({
    id: usuario.id,
    email: datos.email,
    passwordHash: usuario.passwordHash,
    rol: datos.rol,
    nombreCompleto: datos.nombreCompleto,
    activo: datos.activo,
    creadoEn: usuario.creadoEn,
    actualizadoEn: ahora,
  });

  await repositorio.actualizar(usuarioActualizado);
  return ok(usuarioActualizado);
}