import { ITelegramChatRepositorio } from "@/modulos/telegram/aplicacion/i-telegram-chat-repositorio";
import { IAsignacionRepositorio } from "@/modulos/asignaciones/aplicacion/i-asignacion-repositorio";
import { IMatriculaRepositorio } from "@/modulos/matriculas/aplicacion/i-matricula-repositorio";
import { IEstudianteRepositorio } from "@/modulos/estudiantes/aplicacion/i-estudiante-repositorio";
import { INotaRepositorio } from "@/modulos/notas/aplicacion/i-nota-repositorio";
import { ICursoRepositorio } from "@/modulos/cursos/aplicacion/i-curso-repositorio";
import { IPeriodoRepositorio } from "@/modulos/periodos/aplicacion/i-periodo-repositorio";
import { TelegramChatNoEncontradoError } from "@/modulos/telegram/dominio/telegram-chat";
import { AlumnoNoEncontradoError, AlumnoNoAsignadoError } from "@/modulos/telegram/dominio/errores";
import { normalizarTexto } from "@/modulos/telegram/aplicacion/normalizar-texto";
import { Result, ok, err } from "@/compartido/lib/result";

export interface ConsultarNotasTelegramDTO {
  chatId: string;
  estudianteId: string;
  cursoNombre?: string;
  periodoNombre?: string;
}

export interface NotaConsultada {
  curso: string;
  periodo: string;
  tipo: string;
  etiqueta: string;
  valor: number;
  fecha: string;
}

export interface ResultadoConsultaNotas {
  alumno: string;
  notas: NotaConsultada[];
  promedio: number | null;
}

export interface ConsultarNotasTelegramRepos {
  chatRepo: ITelegramChatRepositorio;
  asignacionRepo: IAsignacionRepositorio;
  matriculaRepo: IMatriculaRepositorio;
  estudianteRepo: IEstudianteRepositorio;
  notaRepo: INotaRepositorio;
  cursoRepo: ICursoRepositorio;
  periodoRepo: IPeriodoRepositorio;
}

/**
 * Devuelve las notas de un alumno, pero solo de las asignaciones del
 * profesor vinculado a este chat, y solo si el alumno está matriculado en
 * una de sus secciones. Nunca expone notas de otros profesores.
 */
export async function consultarNotasTelegram(
  datos: ConsultarNotasTelegramDTO,
  repos: ConsultarNotasTelegramRepos
): Promise<Result<ResultadoConsultaNotas>> {
  const chat = await repos.chatRepo.buscarPorChatId(datos.chatId);
  if (!chat) return err(new TelegramChatNoEncontradoError());

  const estudiante = await repos.estudianteRepo.buscarPorId(datos.estudianteId);
  if (!estudiante) return err(new AlumnoNoEncontradoError());

  const asignaciones = await repos.asignacionRepo.listarPorProfesor(chat.profesorId);
  const seccionIds = [...new Set(asignaciones.map((a) => a.seccionId))];

  const matriculasPorSeccion = await Promise.all(seccionIds.map((id) => repos.matriculaRepo.listarPorSeccion(id)));
  const perteneceAlProfesor = matriculasPorSeccion
    .flat()
    .some((m) => m.activo && m.estudianteId === datos.estudianteId);
  if (!perteneceAlProfesor) return err(new AlumnoNoAsignadoError());

  const cursos = await repos.cursoRepo.listar();
  const periodos = await repos.periodoRepo.listar();

  let asignacionesRelevantes = asignaciones;
  if (datos.cursoNombre) {
    const queryCurso = normalizarTexto(datos.cursoNombre);
    const cursoIdsCoincidentes = new Set(
      cursos.filter((c) => normalizarTexto(c.nombre).includes(queryCurso)).map((c) => c.id)
    );
    asignacionesRelevantes = asignacionesRelevantes.filter((a) => cursoIdsCoincidentes.has(a.cursoId));
  }
  if (datos.periodoNombre) {
    const queryPeriodo = normalizarTexto(datos.periodoNombre);
    const periodoIdsCoincidentes = new Set(
      periodos.filter((p) => normalizarTexto(p.nombre).includes(queryPeriodo)).map((p) => p.id)
    );
    asignacionesRelevantes = asignacionesRelevantes.filter((a) => periodoIdsCoincidentes.has(a.periodoId));
  }

  const asignacionIds = new Set(asignacionesRelevantes.map((a) => a.id));
  const nombreCurso = (asignacionId: string) => {
    const a = asignaciones.find((a) => a.id === asignacionId);
    return (a && cursos.find((c) => c.id === a.cursoId)?.nombre) || "(curso eliminado)";
  };
  const nombrePeriodo = (periodoId: string) => periodos.find((p) => p.id === periodoId)?.nombre || "—";

  const todasLasNotas = await repos.notaRepo.listarPorEstudiante(datos.estudianteId);
  const notas: NotaConsultada[] = todasLasNotas
    .filter((n) => asignacionIds.has(n.asignacionId))
    .map((n) => ({
      curso: nombreCurso(n.asignacionId),
      periodo: nombrePeriodo(n.periodoId),
      tipo: n.tipo,
      etiqueta: n.etiqueta,
      valor: n.valor,
      fecha: n.fecha,
    }))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  const promedio = notas.length > 0 ? notas.reduce((suma, n) => suma + n.valor, 0) / notas.length : null;

  return ok({ alumno: estudiante.nombreCompleto, notas, promedio });
}
