import bcrypt from "bcryptjs";
import { IUsuarioRepositorio } from "@/modulos/usuarios/aplicacion/i-usuario-repositorio";
import { ITelegramChatRepositorio } from "@/modulos/telegram/aplicacion/i-telegram-chat-repositorio";
import { ITelegramIntentoRepositorio } from "@/modulos/telegram/aplicacion/i-telegram-intento-repositorio";
import { TelegramChat } from "@/modulos/telegram/dominio/telegram-chat";
import {
  TelegramIntento,
  MAX_INTENTOS_FALLIDOS,
  MINUTOS_BLOQUEO,
  PinIncorrectoError,
  ChatBloqueadoError,
} from "@/modulos/telegram/dominio/telegram-intento";
import { Result, ok, err } from "@/compartido/lib/result";
import { ROLES } from "@/config/constantes";

export interface AutenticarChatTelegramDTO {
  chatId: string;
  pin: string;
}

export interface AutenticarChatTelegramResultado {
  profesorId: string;
  nombreProfesor: string;
}

export async function autenticarChatTelegram(
  datos: AutenticarChatTelegramDTO,
  usuarioRepo: IUsuarioRepositorio,
  chatRepo: ITelegramChatRepositorio,
  intentoRepo: ITelegramIntentoRepositorio
): Promise<Result<AutenticarChatTelegramResultado>> {
  const ahora = new Date();
  const intento = await intentoRepo.buscarPorChatId(datos.chatId);
  if (intento && intento.estaBloqueado(ahora)) {
    return err(new ChatBloqueadoError(intento.bloqueadoHasta!));
  }

  const usuarios = await usuarioRepo.listar();
  const candidatos = usuarios.filter((u) => u.rol === ROLES.PROFESOR && u.activo && u.pinTelegramHash);

  let profesorEncontrado: (typeof candidatos)[number] | null = null;
  for (const candidato of candidatos) {
    // eslint-disable-next-line no-await-in-loop -- bcrypt.compare debe correr secuencial: no hay forma de "buscar" un PIN en Mongo, solo comparar candidato por candidato.
    const coincide = await bcrypt.compare(datos.pin, candidato.pinTelegramHash!);
    if (coincide) {
      profesorEncontrado = candidato;
      break;
    }
  }

  const ahoraISO = ahora.toISOString();

  if (!profesorEncontrado) {
    const intentosPrevios = intento?.intentosFallidos ?? 0;
    const intentosFallidos = intentosPrevios + 1;
    const debeBloquear = intentosFallidos >= MAX_INTENTOS_FALLIDOS;

    const nuevoIntento = new TelegramIntento({
      chatId: datos.chatId,
      intentosFallidos: debeBloquear ? 0 : intentosFallidos,
      bloqueadoHasta: debeBloquear ? new Date(ahora.getTime() + MINUTOS_BLOQUEO * 60_000).toISOString() : undefined,
      actualizadoEn: ahoraISO,
    });
    await intentoRepo.guardar(nuevoIntento);

    if (debeBloquear) return err(new ChatBloqueadoError(nuevoIntento.bloqueadoHasta!));
    return err(new PinIncorrectoError(MAX_INTENTOS_FALLIDOS - intentosFallidos));
  }

  await chatRepo.vincular(
    new TelegramChat({
      chatId: datos.chatId,
      profesorId: profesorEncontrado.id,
      creadoEn: ahoraISO,
      actualizadoEn: ahoraISO,
    })
  );
  await intentoRepo.eliminar(datos.chatId);

  return ok({ profesorId: profesorEncontrado.id, nombreProfesor: profesorEncontrado.nombreCompleto });
}
