"use server";

import { auth } from "@/auth";
import { AsignacionRepositorioMongo } from "@/modulos/asignaciones/infraestructura/asignacion-repositorio-mongo";
import { NotaRepositorioMongo } from "@/modulos/notas/infraestructura/nota-repositorio-mongo";
import { EstudianteRepositorioMongo } from "@/modulos/estudiantes/infraestructura/estudiante-repositorio-mongo";
import { PeriodoRepositorioMongo } from "@/modulos/periodos/infraestructura/periodo-repositorio-mongo";
import { CursoRepositorioMongo } from "@/modulos/cursos/infraestructura/curso-repositorio-mongo";
import { SeccionRepositorioMongo } from "@/modulos/secciones/infraestructura/seccion-repositorio-mongo";
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
import { UnidadDidacticaProps } from "@/modulos/unidades-didacticas/dominio/unidad-didactica";

export async function accionListarMisAsignaciones(): Promise<AsignacionProps[]> {
  const session = await auth();
  const profesorId = session?.user?.id;
  if (!profesorId) return [];
  const repositorio = new AsignacionRepositorioMongo();
  const todas = await repositorio.listarPorProfesor(profesorId);
  return todas.map((a) => a.toPlainObject());
}

export async function accionListarNotasPorAsignacionProfesor(asignacionId: string): Promise<NotaProps[]> {
  const repositorio = new NotaRepositorioMongo();
  const notas = await repositorio.listarPorAsignacion(asignacionId);
  return notas.map((n) => n.toPlainObject());
}

export async function accionListarEstudiantesProfesor(): Promise<EstudianteProps[]> {
  const repositorio = new EstudianteRepositorioMongo();
  const todos = await repositorio.listar();
  return todos.map((e) => e.toPlainObject());
}

export async function accionListarPeriodosProfesor(): Promise<PeriodoProps[]> {
  const repositorio = new PeriodoRepositorioMongo();
  const todos = await repositorio.listar();
  return todos.map((p) => p.toPlainObject());
}

export async function accionListarCursosProfesor(): Promise<CursoProps[]> {
  const repositorio = new CursoRepositorioMongo();
  const todos = await repositorio.listar();
  return todos.map((c) => c.toPlainObject());
}

export async function accionListarSeccionesProfesor(): Promise<SeccionProps[]> {
  const repositorio = new SeccionRepositorioMongo();
  const todas = await repositorio.listar();
  return todas.map((s) => s.toPlainObject());
}

export async function accionListarUnidadesDidacticasProfesor(): Promise<UnidadDidacticaProps[]> {
  const repositorio = new UnidadDidacticaRepositorioMongo();
  const todas = await repositorio.listar();
  return todas.map((u) => u.toPlainObject());
}

export async function accionRegistrarNota(datos: RegistrarNotaDTO): Promise<{ ok: boolean; mensaje: string }> {
  const session = await auth();
  const profesorId = session?.user?.id;
  if (!profesorId) return { ok: false, mensaje: "No autorizado" };

  const notaRepo = new NotaRepositorioMongo();
  const asignacionRepo = new AsignacionRepositorioMongo();
  const unidadDidacticaRepo = new UnidadDidacticaRepositorioMongo();

  const resultado = await registrarNota({ ...datos, profesorId }, notaRepo, asignacionRepo, unidadDidacticaRepo);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Nota registrada correctamente" };
}

export async function accionEditarNota(datos: EditarNotaDTO): Promise<{ ok: boolean; mensaje: string }> {
  const session = await auth();
  const profesorId = session?.user?.id;
  if (!profesorId) return { ok: false, mensaje: "No autorizado" };

  const notaRepo = new NotaRepositorioMongo();
  const asignacionRepo = new AsignacionRepositorioMongo();
  const unidadDidacticaRepo = new UnidadDidacticaRepositorioMongo();

  const resultado = await editarNota({ ...datos, profesorId }, notaRepo, asignacionRepo, unidadDidacticaRepo);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Nota actualizada correctamente" };
}

export async function accionEliminarNotaProfesor(datos: { id: string; cursoId: string; seccionId: string; unidadDidacticaId: string }): Promise<{ ok: boolean; mensaje: string }> {
  const session = await auth();
  const profesorId = session?.user?.id;
  if (!profesorId) return { ok: false, mensaje: "No autorizado" };

  const notaRepo = new NotaRepositorioMongo();
  const asignacionRepo = new AsignacionRepositorioMongo();
  const unidadDidacticaRepo = new UnidadDidacticaRepositorioMongo();

  const resultado = await eliminarNota({ ...datos, profesorId }, notaRepo, asignacionRepo, unidadDidacticaRepo);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Nota eliminada correctamente" };
}