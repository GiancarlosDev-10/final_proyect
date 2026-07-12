"use server";

import { NotaRepositorioMongo } from "@/modulos/notas/infraestructura/nota-repositorio-mongo";
import { AsignacionRepositorioMongo } from "@/modulos/asignaciones/infraestructura/asignacion-repositorio-mongo";
import { EstudianteRepositorioMongo } from "@/modulos/estudiantes/infraestructura/estudiante-repositorio-mongo";
import { CursoRepositorioMongo } from "@/modulos/cursos/infraestructura/curso-repositorio-mongo";
import { SeccionRepositorioMongo } from "@/modulos/secciones/infraestructura/seccion-repositorio-mongo";
import { PeriodoRepositorioMongo } from "@/modulos/periodos/infraestructura/periodo-repositorio-mongo";
import { listarNotasPorAsignacion } from "@/modulos/notas/aplicacion/listar-notas-por-asignacion";
import { NotaProps } from "@/modulos/notas/dominio/nota";
import { AsignacionProps } from "@/modulos/asignaciones/dominio/asignacion";
import { EstudianteProps } from "@/modulos/estudiantes/dominio/estudiante";
import { CursoProps } from "@/modulos/cursos/dominio/curso";
import { SeccionProps } from "@/modulos/secciones/dominio/seccion";
import { PeriodoProps } from "@/modulos/periodos/dominio/periodo";
import { requerirRol } from "@/compartido/lib/autorizacion";
import { ROLES } from "@/config/constantes";

export async function accionListarNotasPorAsignacion(asignacionId: string): Promise<NotaProps[]> {
  if (!(await requerirRol(ROLES.ADMIN))) return [];
  const repositorio = new NotaRepositorioMongo();
  const resultado = await listarNotasPorAsignacion(asignacionId, repositorio);
  if (!resultado.ok) return [];
  return resultado.value.map((n) => n.toPlainObject());
}

export async function accionListarAsignacionesParaNotas(): Promise<AsignacionProps[]> {
  if (!(await requerirRol(ROLES.ADMIN))) return [];
  const repositorio = new AsignacionRepositorioMongo();
  const resultado = await repositorio.listar();
  return resultado.map((a) => a.toPlainObject());
}

export async function accionListarEstudiantesParaNotas(): Promise<EstudianteProps[]> {
  if (!(await requerirRol(ROLES.ADMIN))) return [];
  const repositorio = new EstudianteRepositorioMongo();
  const resultado = await repositorio.listar();
  return resultado.map((e) => e.toPlainObject());
}

export async function accionListarCursosParaNotas(): Promise<CursoProps[]> {
  if (!(await requerirRol(ROLES.ADMIN))) return [];
  const repositorio = new CursoRepositorioMongo();
  const resultado = await repositorio.listar();
  return resultado.map((c) => c.toPlainObject());
}

export async function accionListarSeccionesParaNotas(): Promise<SeccionProps[]> {
  if (!(await requerirRol(ROLES.ADMIN))) return [];
  const repositorio = new SeccionRepositorioMongo();
  const resultado = await repositorio.listar();
  return resultado.map((s) => s.toPlainObject());
}

export async function accionListarPeriodosParaNotas(): Promise<PeriodoProps[]> {
  if (!(await requerirRol(ROLES.ADMIN))) return [];
  const repositorio = new PeriodoRepositorioMongo();
  const resultado = await repositorio.listar();
  return resultado.map((p) => p.toPlainObject());
}
