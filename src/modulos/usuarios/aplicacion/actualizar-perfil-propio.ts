import { IUsuarioRepositorio } from "@/modulos/usuarios/aplicacion/i-usuario-repositorio";
import { Usuario, UsuarioNoEncontradoError } from "@/modulos/usuarios/dominio/usuario";
import { Result, ok, err } from "@/compartido/lib/result";

export interface ActualizarPerfilPropioDTO {
  id: string;
  nombreCompleto: string;
  notasPersonales?: string;
}

export async function actualizarPerfilPropio(
  datos: ActualizarPerfilPropioDTO,
  repositorio: IUsuarioRepositorio
): Promise<Result<Usuario>> {
  const usuario = await repositorio.buscarPorId(datos.id);
  if (!usuario) return err(new UsuarioNoEncontradoError(datos.id));

  const ahora = new Date().toISOString();

  const usuarioActualizado = new Usuario({
    id: usuario.id,
    email: usuario.email,
    passwordHash: usuario.passwordHash,
    rol: usuario.rol,
    nombreCompleto: datos.nombreCompleto,
    activo: usuario.activo,
    pinTelegramHash: usuario.pinTelegramHash,
    notasPersonales: datos.notasPersonales,
    creadoEn: usuario.creadoEn,
    actualizadoEn: ahora,
  });

  await repositorio.actualizar(usuarioActualizado);
  return ok(usuarioActualizado);
}
