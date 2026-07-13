import bcrypt from "bcryptjs";
import { IUsuarioRepositorio } from "@/modulos/usuarios/aplicacion/i-usuario-repositorio";
import { Usuario, UsuarioNoEncontradoError, PinTelegramInvalidoError } from "@/modulos/usuarios/dominio/usuario";
import { validarPinTelegram } from "@/modulos/usuarios/dominio/politica-pin-telegram";
import { Result, ok, err } from "@/compartido/lib/result";

export interface ConfigurarPinTelegramDTO {
  id: string;
  pin: string;
}

export async function configurarPinTelegram(
  datos: ConfigurarPinTelegramDTO,
  repositorio: IUsuarioRepositorio
): Promise<Result<Usuario>> {
  const erroresPin = validarPinTelegram(datos.pin);
  if (erroresPin.length > 0) return err(new PinTelegramInvalidoError(erroresPin));

  const usuario = await repositorio.buscarPorId(datos.id);
  if (!usuario) return err(new UsuarioNoEncontradoError(datos.id));

  const pinTelegramHash = await bcrypt.hash(datos.pin, 10);
  const ahora = new Date().toISOString();

  const usuarioActualizado = new Usuario({
    id: usuario.id,
    email: usuario.email,
    passwordHash: usuario.passwordHash,
    rol: usuario.rol,
    nombreCompleto: usuario.nombreCompleto,
    activo: usuario.activo,
    pinTelegramHash,
    notasPersonales: usuario.notasPersonales,
    creadoEn: usuario.creadoEn,
    actualizadoEn: ahora,
  });

  await repositorio.actualizar(usuarioActualizado);
  return ok(usuarioActualizado);
}
