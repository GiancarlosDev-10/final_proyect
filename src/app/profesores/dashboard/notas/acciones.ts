"use server";

import { requerirRol } from "@/compartido/lib/autorizacion";
import { ROLES } from "@/config/constantes";
import { AsignacionRepositorioMongo } from "@/modulos/asignaciones/infraestructura/asignacion-repositorio-mongo";
import { NotaRepositorioMongo } from "@/modulos/notas/infraestructura/nota-repositorio-mongo";
import { EstudianteRepositorioMongo } from "@/modulos/estudiantes/infraestructura/estudiante-repositorio-mongo";
import { PeriodoRepositorioMongo } from "@/modulos/periodos/infraestructura/periodo-repositorio-mongo";
import { CursoRepositorioMongo } from "@/modulos/cursos/infraestructura/curso-repositorio-mongo";
import { SeccionRepositorioMongo } from "@/modulos/secciones/infraestructura/seccion-repositorio-mongo";
import { MatriculaRepositorioMongo } from "@/modulos/matriculas/infraestructura/matricula-repositorio-mongo";
import { UnidadDidacticaRepositorioMongo } from "@/modulos/unidades-didacticas/infraestructura/unidad-didactica-repositorio-mongo";
import { registrarNota, RegistrarNotaDTO } from "@/modulos/notas/aplicacion/registrar-nota";
import { editarNota, EditarNotaDTO } from "@/modulos/notas/aplicacion/editar-nota";
import { eliminarNota } from "@/modulos/notas/aplicacion/eliminar-nota";
import { AsignacionProps } from "@/modulos/asignaciones/dominio/asignacion";
import { NotaProps } from "@/modulos/notas/dominio/nota";
import { EstudianteProps } from "@/modulos/estudiantes/dominio/estudiante";
import { PeriodoProps } from "@/modulos/periodos/dominio/periodo";
import { CursoProps } from "@/modulos/cursos/dominio/curso";
import { SeccionProps } from "@/modulos/secciones/dominio/seccion";
import { MatriculaProps } from "@/modulos/matriculas/dominio/matricula";
import { UnidadDidacticaProps } from "@/modulos/unidades-didacticas/dominio/unidad-didactica";

export async function accionListarMisAsignaciones(): Promise<AsignacionProps[]> {
  const profesorId = await requerirRol(ROLES.PROFESOR);
  if (!profesorId) return [];
  const repositorio = new AsignacionRepositorioMongo();
  const todas = await repositorio.listarPorProfesor(profesorId);
  return todas.map((a) => a.toPlainObject());
}

// El asignacionId llega desde el cliente — sin verificar que pertenezca al
// profesor autenticado, cualquiera podía pedir las notas de una asignación
// de OTRO profesor con solo conocer o adivinar su id.
export async function accionListarNotasPorAsignacionProfesor(asignacionId: string): Promise<NotaProps[]> {
  const profesorId = await requerirRol(ROLES.PROFESOR);
  if (!profesorId) return [];
  const asignacionRepo = new AsignacionRepositorioMongo();
  const asignacion = await asignacionRepo.buscarPorId(asignacionId);
  if (!asignacion || asignacion.profesorId !== profesorId) return [];
  const repositorio = new NotaRepositorioMongo();
  const notas = await repositorio.listarPorAsignacion(asignacionId);
  return notas.map((n) => n.toPlainObject());
}

export async function accionListarEstudiantesProfesor(): Promise<EstudianteProps[]> {
  if (!(await requerirRol(ROLES.PROFESOR))) return [];
  const repositorio = new EstudianteRepositorioMongo();
  const todos = await repositorio.listar();
  return todos.map((e) => e.toPlainObject());
}

export async function accionListarPeriodosProfesor(): Promise<PeriodoProps[]> {
  if (!(await requerirRol(ROLES.PROFESOR))) return [];
  const repositorio = new PeriodoRepositorioMongo();
  const todos = await repositorio.listar();
  return todos.map((p) => p.toPlainObject());
}

export async function accionListarCursosProfesor(): Promise<CursoProps[]> {
  if (!(await requerirRol(ROLES.PROFESOR))) return [];
  const repositorio = new CursoRepositorioMongo();
  const todos = await repositorio.listar();
  return todos.map((c) => c.toPlainObject());
}

export async function accionListarSeccionesProfesor(): Promise<SeccionProps[]> {
  if (!(await requerirRol(ROLES.PROFESOR))) return [];
  const repositorio = new SeccionRepositorioMongo();
  const todas = await repositorio.listar();
  return todas.map((s) => s.toPlainObject());
}

export async function accionListarUnidadesDidacticasProfesor(): Promise<UnidadDidacticaProps[]> {
  if (!(await requerirRol(ROLES.PROFESOR))) return [];
  const repositorio = new UnidadDidacticaRepositorioMongo();
  const todas = await repositorio.listar();
  return todas.map((u) => u.toPlainObject());
}

export async function accionListarMatriculasProfesor(): Promise<MatriculaProps[]> {
  if (!(await requerirRol(ROLES.PROFESOR))) return [];
  const repositorio = new MatriculaRepositorioMongo();
  const todas = await repositorio.listar();
  return todas.map((m) => m.toPlainObject());
}

export async function accionRegistrarNota(datos: RegistrarNotaDTO): Promise<{ ok: boolean; mensaje: string }> {
  const profesorId = await requerirRol(ROLES.PROFESOR);
  if (!profesorId) return { ok: false, mensaje: "No autorizado" };

  const notaRepo = new NotaRepositorioMongo();
  const asignacionRepo = new AsignacionRepositorioMongo();
  const unidadDidacticaRepo = new UnidadDidacticaRepositorioMongo();

  const resultado = await registrarNota({ ...datos, profesorId }, notaRepo, asignacionRepo, unidadDidacticaRepo);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Nota registrada correctamente" };
}

export async function accionEditarNota(datos: EditarNotaDTO): Promise<{ ok: boolean; mensaje: string }> {
  const profesorId = await requerirRol(ROLES.PROFESOR);
  if (!profesorId) return { ok: false, mensaje: "No autorizado" };

  const notaRepo = new NotaRepositorioMongo();
  const asignacionRepo = new AsignacionRepositorioMongo();
  const unidadDidacticaRepo = new UnidadDidacticaRepositorioMongo();

  const resultado = await editarNota({ ...datos, profesorId }, notaRepo, asignacionRepo, unidadDidacticaRepo);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Nota actualizada correctamente" };
}

export async function accionEliminarNotaProfesor(datos: { id: string; cursoId: string; seccionId: string; unidadDidacticaId: string }): Promise<{ ok: boolean; mensaje: string }> {
  const profesorId = await requerirRol(ROLES.PROFESOR);
  if (!profesorId) return { ok: false, mensaje: "No autorizado" };

  const notaRepo = new NotaRepositorioMongo();
  const asignacionRepo = new AsignacionRepositorioMongo();
  const unidadDidacticaRepo = new UnidadDidacticaRepositorioMongo();

  const resultado = await eliminarNota({ ...datos, profesorId }, notaRepo, asignacionRepo, unidadDidacticaRepo);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Nota eliminada correctamente" };
}