import { ITelegramChatRepositorio } from "@/modulos/telegram/aplicacion/i-telegram-chat-repositorio";
import { IAsignacionRepositorio } from "@/modulos/asignaciones/aplicacion/i-asignacion-repositorio";
import { IMatriculaRepositorio } from "@/modulos/matriculas/aplicacion/i-matricula-repositorio";
import { IEstudianteRepositorio } from "@/modulos/estudiantes/aplicacion/i-estudiante-repositorio";
import { ISeccionRepositorio } from "@/modulos/secciones/aplicacion/i-seccion-repositorio";
import { TelegramChatNoEncontradoError } from "@/modulos/telegram/dominio/telegram-chat";
import { normalizarTexto } from "@/compartido/lib/normalizar-texto";
import { Result, ok, err } from "@/compartido/lib/result";

export interface CandidatoAlumno {
  estudianteId: string;
  nombreCompleto: string;
  seccion: string;
}

export interface BuscarAlumnoTelegramRepos {
  chatRepo: ITelegramChatRepositorio;
  asignacionRepo: IAsignacionRepositorio;
  matriculaRepo: IMatriculaRepositorio;
  estudianteRepo: IEstudianteRepositorio;
  seccionRepo: ISeccionRepositorio;
}

/**
 * Busca, solo entre los alumnos de las secciones del profesor vinculado a este
 * chat, los que coincidan (por nombre completo, sin tildes) con lo escrito en
 * el bot. Nunca busca fuera de las secciones asignadas al profesor.
 */
export async function buscarAlumnoTelegram(
  chatId: string,
  nombreQuery: string,
  repos: BuscarAlumnoTelegramRepos
): Promise<Result<CandidatoAlumno[]>> {
  const chat = await repos.chatRepo.buscarPorChatId(chatId);
  if (!chat) return err(new TelegramChatNoEncontradoError());

  const asignaciones = await repos.asignacionRepo.listarPorProfesor(chat.profesorId);
  const seccionIds = [...new Set(asignaciones.map((a) => a.seccionId))];

  const matriculasPorSeccion = await Promise.all(seccionIds.map((id) => repos.matriculaRepo.listarPorSeccion(id)));
  const matriculasActivas = matriculasPorSeccion.flat().filter((m) => m.activo);

  const secciones = await repos.seccionRepo.listar();
  const nombreSeccion = (seccionId: string) => {
    const s = secciones.find((s) => s.id === seccionId);
    return s ? `${s.grado} ${s.nombre}` : "(sección eliminada)";
  };

  const query = normalizarTexto(nombreQuery);
  const candidatos: CandidatoAlumno[] = [];

  const estudiantes = await Promise.all(matriculasActivas.map((m) => repos.estudianteRepo.buscarPorId(m.estudianteId)));

  matriculasActivas.forEach((matricula, indice) => {
    const estudiante = estudiantes[indice];
    if (!estudiante || !estudiante.activo) return;
    if (!normalizarTexto(estudiante.nombreCompleto).includes(query)) return;
    candidatos.push({
      estudianteId: estudiante.id,
      nombreCompleto: estudiante.nombreCompleto,
      seccion: nombreSeccion(matricula.seccionId),
    });
  });

  return ok(candidatos);
}
