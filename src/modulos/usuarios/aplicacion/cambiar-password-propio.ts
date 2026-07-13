import bcrypt from "bcryptjs";
import { IUsuarioRepositorio } from "@/modulos/usuarios/aplicacion/i-usuario-repositorio";
import { Usuario, UsuarioNoEncontradoError, PasswordActualIncorrectaError, PasswordDebilError } from "@/modulos/usuarios/dominio/usuario";
import { validarPassword } from "@/modulos/usuarios/dominio/politica-password";
import { Result, ok, err } from "@/compartido/lib/result";

export interface CambiarPasswordPropioDTO {
  id: string;
  passwordActual: string;
  passwordNueva: string;
}

export async function cambiarPasswordPropio(
  datos: CambiarPasswordPropioDTO,
  repositorio: IUsuarioRepositorio
): Promise<Result<Usuario>> {
  const usuario = await repositorio.buscarPorId(datos.id);
  if (!usuario) return err(new UsuarioNoEncontradoError(datos.id));

  const passwordValida = await bcrypt.compare(datos.passwordActual, usuario.passwordHash);
  if (!passwordValida) return err(new PasswordActualIncorrectaError());

  const erroresPassword = validarPassword(datos.passwordNueva);
  if (erroresPassword.length > 0) return err(new PasswordDebilError(erroresPassword));

  const passwordHash = await bcrypt.hash(datos.passwordNueva, 10);
  const ahora = new Date().toISOString();

  const usuarioActualizado = new Usuario({
    id: usuario.id,
    email: usuario.email,
    passwordHash,
    rol: usuario.rol,
    nombreCompleto: usuario.nombreCompleto,
    activo: usuario.activo,
    pinTelegramHash: usuario.pinTelegramHash,
    notasPersonales: usuario.notasPersonales,
    creadoEn: usuario.creadoEn,
    actualizadoEn: ahora,
  });

  await repositorio.actualizar(usuarioActualizado);
  return ok(usuarioActualizado);
}
