"use server";

import { EstudianteRepositorioMongo } from "@/modulos/estudiantes/infraestructura/estudiante-repositorio-mongo";
import { AreaRepositorioMongo } from "@/modulos/areas/infraestructura/area-repositorio-mongo";
import { PeriodoRepositorioMongo } from "@/modulos/periodos/infraestructura/periodo-repositorio-mongo";
import { CursoRepositorioMongo } from "@/modulos/cursos/infraestructura/curso-repositorio-mongo";
import { UnidadDidacticaRepositorioMongo } from "@/modulos/unidades-didacticas/infraestructura/unidad-didactica-repositorio-mongo";
import { NotaRepositorioMongo } from "@/modulos/notas/infraestructura/nota-repositorio-mongo";
import { AsignacionRepositorioMongo } from "@/modulos/asignaciones/infraestructura/asignacion-repositorio-mongo";
import { calcularPromedioArea, CalcularPromedioAreaDTO, PromedioArea } from "@/modulos/reportes/aplicacion/calcular-promedio-area";
import { EstudianteProps } from "@/modulos/estudiantes/dominio/estudiante";
import { AreaProps } from "@/modulos/areas/dominio/area";
import { PeriodoProps } from "@/modulos/periodos/dominio/periodo";
import { CursoProps } from "@/modulos/cursos/dominio/curso";
import { UnidadDidacticaProps } from "@/modulos/unidades-didacticas/dominio/unidad-didactica";
import { requerirRol } from "@/compartido/lib/autorizacion";
import { ROLES } from "@/config/constantes";

export async function accionListarEstudiantesParaReportes(): Promise<EstudianteProps[]> {
  if (!(await requerirRol(ROLES.ADMIN))) return [];
  const repositorio = new EstudianteRepositorioMongo();
  const todos = await repositorio.listar();
  return todos.map((e) => e.toPlainObject());
}

export async function accionListarAreasParaReportes(): Promise<AreaProps[]> {
  if (!(await requerirRol(ROLES.ADMIN))) return [];
  const repositorio = new AreaRepositorioMongo();
  const todas = await repositorio.listar();
  return todas.map((a) => a.toPlainObject());
}

export async function accionListarPeriodosParaReportes(): Promise<PeriodoProps[]> {
  if (!(await requerirRol(ROLES.ADMIN))) return [];
  const repositorio = new PeriodoRepositorioMongo();
  const todos = await repositorio.listar();
  return todos.map((p) => p.toPlainObject());
}

export async function accionListarCursosParaReportes(): Promise<CursoProps[]> {
  if (!(await requerirRol(ROLES.ADMIN))) return [];
  const repositorio = new CursoRepositorioMongo();
  const todos = await repositorio.listar();
  return todos.map((c) => c.toPlainObject());
}

export async function accionListarUnidadesDidacticasParaReportes(): Promise<UnidadDidacticaProps[]> {
  if (!(await requerirRol(ROLES.ADMIN))) return [];
  const repositorio = new UnidadDidacticaRepositorioMongo();
  const todas = await repositorio.listar();
  return todas.map((u) => u.toPlainObject());
}

export async function accionCalcularPromedioArea(datos: CalcularPromedioAreaDTO): Promise<PromedioArea | null> {
  if (!(await requerirRol(ROLES.ADMIN))) return null;
  const cursoRepo = new CursoRepositorioMongo();
  const notaRepo = new NotaRepositorioMongo();
  const asignacionRepo = new AsignacionRepositorioMongo();
  const unidadRepo = new UnidadDidacticaRepositorioMongo();

  const resultado = await calcularPromedioArea(datos, cursoRepo, notaRepo, asignacionRepo, unidadRepo);
  if (!resultado.ok) return null;
  return resultado.value;
}
