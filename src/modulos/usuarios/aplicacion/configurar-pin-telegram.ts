import bcrypt from "bcryptjs";
import { IUsuarioRepositorio } from "@/modulos/usuarios/aplicacion/i-usuario-repositorio";
import {
  Usuario,
  UsuarioNoEncontradoError,
  PinTelegramInvalidoError,
  PinTelegramDuplicadoError,
} from "@/modulos/usuarios/dominio/usuario";
import { validarPinTelegram } from "@/modulos/usuarios/dominio/politica-pin-telegram";
import { Result, ok, err } from "@/compartido/lib/result";
import { ROLES } from "@/config/constantes";

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

  // El PIN se guarda hasheado (bcrypt, con sal), así que no se puede
  // detectar la colisión con una consulta directa — hay que comparar contra
  // el hash de cada profesor activo con PIN configurado, igual que hace
  // autenticarChatTelegram al validar el PIN entrante. Sin este chequeo, dos
  // profesores con el mismo PIN quedaban indistinguibles para Telegram: el
  // bot autentica como el primero cuyo hash coincida.
  const otrosUsuarios = await repositorio.listar();
  const candidatos = otrosUsuarios.filter(
    (u) => u.id !== usuario.id && u.rol === ROLES.PROFESOR && u.activo && u.pinTelegramHash
  );
  for (const candidato of candidatos) {
    // bcrypt.compare corre secuencial: no hay forma de "buscar" un PIN en Mongo, solo comparar candidato por candidato.
    const coincide = await bcrypt.compare(datos.pin, candidato.pinTelegramHash!);
    if (coincide) return err(new PinTelegramDuplicadoError());
  }

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
