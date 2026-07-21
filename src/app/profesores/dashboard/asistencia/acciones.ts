"use server";

import { requerirSesion } from "@/compartido/lib/autorizacion";
import { EstadoAsistencia } from "@/config/constantes";

import { BloqueHorarioRepositorioMongo } from "@/modulos/horarios/infraestructura/bloque-horario-repositorio-mongo";
import { AsignacionRepositorioMongo } from "@/modulos/asignaciones/infraestructura/asignacion-repositorio-mongo";
import { SeccionRepositorioMongo } from "@/modulos/secciones/infraestructura/seccion-repositorio-mongo";
import { CursoRepositorioMongo } from "@/modulos/cursos/infraestructura/curso-repositorio-mongo";
import { MatriculaRepositorioMongo } from "@/modulos/matriculas/infraestructura/matricula-repositorio-mongo";
import { EstudianteRepositorioMongo } from "@/modulos/estudiantes/infraestructura/estudiante-repositorio-mongo";
import { SesionAsistenciaRepositorioMongo } from "@/modulos/asistencia/infraestructura/sesion-asistencia-repositorio-mongo";
import { RegistroAsistenciaRepositorioMongo } from "@/modulos/asistencia/infraestructura/registro-asistencia-repositorio-mongo";

import { listarBloquesDeHoy, BloqueDeHoy } from "@/modulos/asistencia/aplicacion/listar-bloques-de-hoy";
import { abrirSesionAsistencia } from "@/modulos/asistencia/aplicacion/abrir-sesion-asistencia";
import { actualizarUmbralesSesion } from "@/modulos/asistencia/aplicacion/actualizar-umbrales-sesion";
import { listarRoster, FilaRoster } from "@/modulos/asistencia/aplicacion/listar-roster";
import { marcarAsistencia } from "@/modulos/asistencia/aplicacion/marcar-asistencia";
import { SesionAsistenciaProps } from "@/modulos/asistencia/dominio/sesion-asistencia";

const bloqueRepo = new BloqueHorarioRepositorioMongo();
const asignacionRepo = new AsignacionRepositorioMongo();
const seccionRepo = new SeccionRepositorioMongo();
const cursoRepo = new CursoRepositorioMongo();
const matriculaRepo = new MatriculaRepositorioMongo();
const estudianteRepo = new EstudianteRepositorioMongo();
const sesionRepo = new SesionAsistenciaRepositorioMongo();
const registroRepo = new RegistroAsistenciaRepositorioMongo();

export async function accionListarBloquesDeHoy(): Promise<BloqueDeHoy[]> {
  const sesion = await requerirSesion();
  if (!sesion) return [];
  const resultado = await listarBloquesDeHoy(sesion.id, { bloqueRepo, asignacionRepo, seccionRepo, cursoRepo });
  return resultado.ok ? resultado.value : [];
}

export async function accionAbrirSesion(
  bloqueHorarioId: string
): Promise<{ ok: true; sesion: SesionAsistenciaProps } | { ok: false; mensaje: string }> {
  const sesionUsuario = await requerirSesion();
  if (!sesionUsuario) return { ok: false, mensaje: "No autorizado" };

  const bloque = await bloqueRepo.buscarPorId(bloqueHorarioId);
  if (!bloque || bloque.profesorId !== sesionUsuario.id) return { ok: false, mensaje: "No autorizado" };

  const resultado = await abrirSesionAsistencia(bloqueHorarioId, { sesionRepo, bloqueRepo });
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, sesion: resultado.value.toPlainObject() };
}

export async function accionActualizarUmbrales(datos: {
  sesionId: string;
  horaEntrada: string;
  horaLimiteTardanza: string;
  horaCierre: string;
}): Promise<{ ok: true; sesion: SesionAsistenciaProps } | { ok: false; mensaje: string }> {
  const sesionUsuario = await requerirSesion();
  if (!sesionUsuario) return { ok: false, mensaje: "No autorizado" };

  const propia = await sesionRepo.buscarPorId(datos.sesionId);
  if (!propia) return { ok: false, mensaje: "No autorizado" };
  const bloque = await bloqueRepo.buscarPorId(propia.bloqueHorarioId);
  if (!bloque || bloque.profesorId !== sesionUsuario.id) return { ok: false, mensaje: "No autorizado" };

  const resultado = await actualizarUmbralesSesion(datos, sesionRepo);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, sesion: resultado.value.toPlainObject() };
}

export async function accionListarRoster(sesionId: string, seccionId: string): Promise<FilaRoster[]> {
  const sesionUsuario = await requerirSesion();
  if (!sesionUsuario) return [];

  const propia = await sesionRepo.buscarPorId(sesionId);
  if (!propia) return [];
  const bloque = await bloqueRepo.buscarPorId(propia.bloqueHorarioId);
  if (!bloque || bloque.profesorId !== sesionUsuario.id) return [];

  const resultado = await listarRoster(sesionId, seccionId, { sesionRepo, matriculaRepo, estudianteRepo, registroRepo });
  return resultado.ok ? resultado.value : [];
}

export async function accionMarcarAsistencia(
  sesionId: string,
  estudianteId: string,
  estado: EstadoAsistencia
): Promise<{ ok: boolean; mensaje: string }> {
  const sesionUsuario = await requerirSesion();
  if (!sesionUsuario) return { ok: false, mensaje: "No autorizado" };

  const propia = await sesionRepo.buscarPorId(sesionId);
  if (!propia) return { ok: false, mensaje: "No autorizado" };
  const bloque = await bloqueRepo.buscarPorId(propia.bloqueHorarioId);
  if (!bloque || bloque.profesorId !== sesionUsuario.id) return { ok: false, mensaje: "No autorizado" };

  const resultado = await marcarAsistencia(sesionId, estudianteId, estado, registroRepo);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Asistencia actualizada" };
}
