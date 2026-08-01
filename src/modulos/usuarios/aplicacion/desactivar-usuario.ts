import { IUsuarioRepositorio } from "@/modulos/usuarios/aplicacion/i-usuario-repositorio";
import { Usuario, UsuarioNoEncontradoError, UltimoAdministradorError } from "@/modulos/usuarios/dominio/usuario";
import { Result, ok, err } from "@/compartido/lib/result";
import { ROLES } from "@/config/constantes";

export async function desactivarUsuario(
  id: string,
  repositorio: IUsuarioRepositorio
): Promise<Result<Usuario>> {
  const usuario = await repositorio.buscarPorId(id);
  if (!usuario) return err(new UsuarioNoEncontradoError(id));

  if (usuario.rol === ROLES.ADMIN && usuario.activo) {
    const todos = await repositorio.listar();
    const quedanOtrosAdmins = todos.some((u) => u.id !== usuario.id && u.rol === ROLES.ADMIN && u.activo);
    if (!quedanOtrosAdmins) return err(new UltimoAdministradorError());
  }

  const ahora = new Date().toISOString();

  const usuarioDesactivado = new Usuario({
    id: usuario.id,
    email: usuario.email,
    passwordHash: usuario.passwordHash,
    rol: usuario.rol,
    nombreCompleto: usuario.nombreCompleto,
    activo: false,
    creadoEn: usuario.creadoEn,
    actualizadoEn: ahora,
  });

  await repositorio.actualizar(usuarioDesactivado);
  return ok(usuarioDesactivado);
}