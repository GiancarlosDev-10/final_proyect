import { randomInt } from "node:crypto";
import { IEstudianteRepositorio } from "@/modulos/estudiantes/aplicacion/i-estudiante-repositorio";
import { ICodigoApoderadoRepositorio } from "@/modulos/telegram/aplicacion/i-codigo-apoderado-repositorio";
import { IApoderadoIntentoRepositorio } from "@/modulos/telegram/aplicacion/i-apoderado-intento-repositorio";
import { CodigoApoderado, MINUTOS_EXPIRACION_CODIGO_APODERADO, EstudianteSinEmailApoderadoError } from "@/modulos/telegram/dominio/codigo-apoderado";
import {
  ApoderadoIntento,
  MAX_INTENTOS_FALLIDOS_APODERADO,
  MINUTOS_BLOQUEO_APODERADO,
  ChatApoderadoBloqueadoError,
} from "@/modulos/telegram/dominio/apoderado-intento";
import { EstudianteNoEncontradoError } from "@/modulos/estudiantes/dominio/estudiante";
import { Result, ok, err } from "@/compartido/lib/result";

export interface IniciarVinculacionApoderadoDTO {
  chatId: string;
  dniEstudiante: string;
}

export interface IniciarVinculacionApoderadoResultado {
  nombreEstudiante: string;
  emailApoderado: string;
  emailEnmascarado: string;
  codigo: string;
}

export interface IniciarVinculacionApoderadoRepos {
  estudianteRepo: IEstudianteRepositorio;
  codigoRepo: ICodigoApoderadoRepositorio;
  intentoRepo: IApoderadoIntentoRepositorio;
}

function enmascararEmail(email: string): string {
  const [local, dominio] = email.split("@");
  if (!dominio) return email;
  return `${local[0] ?? ""}***@${dominio}`;
}

function generarCodigo(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/**
 * Primer paso de la vinculación del apoderado: valida el DNI del alumno,
 * genera un código de 6 dígitos y lo guarda (un código pendiente por chat, se
 * sobreescribe si pide uno nuevo). El código se manda por email al
 * apoderado ya registrado — es el segundo factor, así el DNI (poco secreto,
 * un compañero de aula podría conocerlo) no alcanza por sí solo para
 * vincularse a las notificaciones de otro alumno.
 */
export async function iniciarVinculacionApoderado(
  datos: IniciarVinculacionApoderadoDTO,
  repos: IniciarVinculacionApoderadoRepos
): Promise<Result<IniciarVinculacionApoderadoResultado>> {
  const ahora = new Date();

  const intento = await repos.intentoRepo.buscarPorChatId(datos.chatId);
  if (intento && intento.estaBloqueado(ahora)) {
    return err(new ChatApoderadoBloqueadoError(intento.bloqueadoHasta!));
  }

  const estudiante = await repos.estudianteRepo.buscarPorDocumento(datos.dniEstudiante);

  if (!estudiante || !estudiante.activo || !estudiante.apoderado.email) {
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
    if (!estudiante || !estudiante.activo) return err(new EstudianteNoEncontradoError(datos.dniEstudiante));
    return err(new EstudianteSinEmailApoderadoError());
  }

  const codigo = generarCodigo();
  const codigoApoderado = new CodigoApoderado({
    chatId: datos.chatId,
    estudianteId: estudiante.id,
    codigo,
    expiresAt: new Date(ahora.getTime() + MINUTOS_EXPIRACION_CODIGO_APODERADO * 60_000).toISOString(),
    creadoEn: ahora.toISOString(),
  });
  await repos.codigoRepo.guardar(codigoApoderado);

  return ok({
    nombreEstudiante: estudiante.nombreCompleto,
    emailApoderado: estudiante.apoderado.email,
    emailEnmascarado: enmascararEmail(estudiante.apoderado.email),
    codigo,
  });
}
