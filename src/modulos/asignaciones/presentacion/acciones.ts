"use server";

import { AsignacionRepositorioMongo } from "@/modulos/asignaciones/infraestructura/asignacion-repositorio-mongo";
import { UsuarioRepositorioMongo } from "@/modulos/usuarios/infraestructura/usuario-repositorio-mongo";
import { CursoRepositorioMongo } from "@/modulos/cursos/infraestructura/curso-repositorio-mongo";
import { SeccionRepositorioMongo } from "@/modulos/secciones/infraestructura/seccion-repositorio-mongo";
import { PeriodoRepositorioMongo } from "@/modulos/periodos/infraestructura/periodo-repositorio-mongo";
import { UnidadDidacticaRepositorioMongo } from "@/modulos/unidades-didacticas/infraestructura/unidad-didactica-repositorio-mongo";
import { listarAsignaciones } from "@/modulos/asignaciones/aplicacion/listar-asignaciones";
import { crearAsignacion, CrearAsignacionDTO } from "@/modulos/asignaciones/aplicacion/crear-asignacion";
import { actualizarAsignacion, ActualizarAsignacionDTO } from "@/modulos/asignaciones/aplicacion/actualizar-asignacion";
import { eliminarAsignacion } from "@/modulos/asignaciones/aplicacion/eliminar-asignacion";
import { generarUnidadesDidacticas } from "@/modulos/unidades-didacticas/aplicacion/generar-unidades-didacticas";
import { AsignacionProps } from "@/modulos/asignaciones/dominio/asignacion";
import { UsuarioPublico } from "@/modulos/usuarios/dominio/usuario";
import { CursoProps } from "@/modulos/cursos/dominio/curso";
import { SeccionProps } from "@/modulos/secciones/dominio/seccion";
import { PeriodoProps } from "@/modulos/periodos/dominio/periodo";
import { ROLES } from "@/config/constantes";
import { requerirRol } from "@/compartido/lib/autorizacion";

export async function accionListarAsignaciones(): Promise<AsignacionProps[]> {
  if (!(await requerirRol(ROLES.ADMIN))) return [];
  const repositorio = new AsignacionRepositorioMongo();
  const resultado = await listarAsignaciones(repositorio);
  if (!resultado.ok) return [];
  return resultado.value.map((a) => a.toPlainObject());
}

export async function accionListarProfesores(): Promise<UsuarioPublico[]> {
  if (!(await requerirRol(ROLES.ADMIN))) return [];
  const repositorio = new UsuarioRepositorioMongo();
  const todos = await repositorio.listar();
  return todos.filter((u) => u.rol === ROLES.PROFESOR).map((u) => u.toPlainObjectPublico());
}

export async function accionListarCursosParaAsignacion(): Promise<CursoProps[]> {
  if (!(await requerirRol(ROLES.ADMIN))) return [];
  const repositorio = new CursoRepositorioMongo();
  const resultado = await repositorio.listar();
  return resultado.map((c) => c.toPlainObject());
}

export async function accionListarSeccionesParaAsignacion(): Promise<SeccionProps[]> {
  if (!(await requerirRol(ROLES.ADMIN))) return [];
  const repositorio = new SeccionRepositorioMongo();
  const resultado = await repositorio.listar();
  return resultado.map((s) => s.toPlainObject());
}

export async function accionListarPeriodosParaAsignacion(): Promise<PeriodoProps[]> {
  if (!(await requerirRol(ROLES.ADMIN))) return [];
  const repositorio = new PeriodoRepositorioMongo();
  const resultado = await repositorio.listar();
  return resultado.map((p) => p.toPlainObject());
}

export async function accionCrearAsignacion(datos: CrearAsignacionDTO): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new AsignacionRepositorioMongo();
  const resultado = await crearAsignacion(datos, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };

  // Un curso siempre tiene Unidad 1 y Unidad 2 en cada bimestre que se dicta;
  // se generan aquí (si no existen ya) apenas queda ligado a un periodo.
  const unidadDidacticaRepositorio = new UnidadDidacticaRepositorioMongo();
  const periodoRepositorio = new PeriodoRepositorioMongo();
  await generarUnidadesDidacticas(
    { cursoId: datos.cursoId, periodoId: datos.periodoId },
    unidadDidacticaRepositorio,
    periodoRepositorio
  );

  return { ok: true, mensaje: "Asignación creada correctamente" };
}

export async function accionActualizarAsignacion(datos: ActualizarAsignacionDTO): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new AsignacionRepositorioMongo();
  const resultado = await actualizarAsignacion(datos, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Asignación actualizada correctamente" };
}

export async function accionEliminarAsignacion(id: string): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new AsignacionRepositorioMongo();
  const resultado = await eliminarAsignacion(id, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Asignación eliminada correctamente" };
}
