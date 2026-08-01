import { IEstudianteRepositorio } from "@/modulos/estudiantes/aplicacion/i-estudiante-repositorio";
import { ICodigoApoderadoRepositorio } from "@/modulos/telegram/aplicacion/i-codigo-apoderado-repositorio";
import { IApoderadoVinculadoRepositorio } from "@/modulos/telegram/aplicacion/i-apoderado-vinculado-repositorio";
import { IApoderadoIntentoRepositorio } from "@/modulos/telegram/aplicacion/i-apoderado-intento-repositorio";
import { CodigoApoderadoNoEncontradoError, CodigoApoderadoExpiradoError, CodigoApoderadoIncorrectoError } from "@/modulos/telegram/dominio/codigo-apoderado";
import { ApoderadoVinculado } from "@/modulos/telegram/dominio/apoderado-vinculado";
import {
  ApoderadoIntento,
  MAX_INTENTOS_FALLIDOS_APODERADO,
  MINUTOS_BLOQUEO_APODERADO,
  ChatApoderadoBloqueadoError,
} from "@/modulos/telegram/dominio/apoderado-intento";
import { EstudianteNoEncontradoError } from "@/modulos/estudiantes/dominio/estudiante";
import { generarId } from "@/compartido/lib/uuid";
import { Result, ok, err } from "@/compartido/lib/result";
import { compararSecretoTimingSafe } from "@/compartido/lib/comparar-secreto";

export interface VerificarCodigoApoderadoDTO {
  chatId: string;
  codigo: string;
}

export interface VerificarCodigoApoderadoResultado {
  nombreEstudiante: string;
  nombreApoderado: string;
}

export interface VerificarCodigoApoderadoRepos {
  estudianteRepo: IEstudianteRepositorio;
  codigoRepo: ICodigoApoderadoRepositorio;
  vinculadoRepo: IApoderadoVinculadoRepositorio;
  intentoRepo: IApoderadoIntentoRepositorio;
}

/**
 * Segundo paso de la vinculación: valida el código de 6 dígitos que le llegó
 * al apoderado por email. Si coincide y no expiró, confirma el vínculo
 * chatId↔estudiante para las notificaciones de asistencia.
 */
export async function verificarCodigoApoderado(
  datos: VerificarCodigoApoderadoDTO,
  repos: VerificarCodigoApoderadoRepos
): Promise<Result<VerificarCodigoApoderadoResultado>> {
  const ahora = new Date();

  const intento = await repos.intentoRepo.buscarPorChatId(datos.chatId);
  if (intento && intento.estaBloqueado(ahora)) {
    return err(new ChatApoderadoBloqueadoError(intento.bloqueadoHasta!));
  }

  const codigoGuardado = await repos.codigoRepo.buscarPorChatId(datos.chatId);
  if (!codigoGuardado) {
    return err(new CodigoApoderadoNoEncontradoError());
  }

  if (codigoGuardado.estaExpirado(ahora)) {
    await repos.codigoRepo.eliminar(datos.chatId);
    return err(new CodigoApoderadoExpiradoError());
  }

  if (!compararSecretoTimingSafe(datos.codigo, codigoGuardado.codigo)) {
    const intentosPrevios = intento?.intentosFallidos ?? 0;
    const intentosFallidos = intentosPrevios + 1;
    const debeBloquear = intentosFallidos >= MAX_INTENTOS_FALLIDOS_APODERADO;

    const nuevoIntento = new ApoderadoIntento({
      chatId: datos.chatId,
      intentosFallidos: debeBloquear ? 0 : intentosFallidos,
      bloqueadoHasta: debeBloquear
        ? new Date(ahora.getTime() + MINUTOS_BLOQUEO_APODERADO * 60_000).toISOString()
        : undefined,
      actualizadoEn: ahora.toISOString(),
    });
    await repos.intentoRepo.guardar(nuevoIntento);

    if (debeBloquear) return err(new ChatApoderadoBloqueadoError(nuevoIntento.bloqueadoHasta!));
    return err(new CodigoApoderadoIncorrectoError());
  }

  const estudiante = await repos.estudianteRepo.buscarPorId(codigoGuardado.estudianteId);
  if (!estudiante) return err(new EstudianteNoEncontradoError(codigoGuardado.estudianteId));

  await repos.vinculadoRepo.vincular(
    new ApoderadoVinculado({
      id: generarId("APOD"),
      chatId: datos.chatId,
      estudianteId: estudiante.id,
      creadoEn: ahora.toISOString(),
    })
  );
  await repos.codigoRepo.eliminar(datos.chatId);
  if (intento) await repos.intentoRepo.eliminar(datos.chatId);

  return ok({ nombreEstudiante: estudiante.nombreCompleto, nombreApoderado: estudiante.apoderado.nombre });
}
