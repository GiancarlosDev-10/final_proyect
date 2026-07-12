"use server";

import { CursoRepositorioMongo } from "@/modulos/cursos/infraestructura/curso-repositorio-mongo";
import { listarCursos } from "@/modulos/cursos/aplicacion/listar-cursos";
import { crearCurso, CrearCursoDTO } from "@/modulos/cursos/aplicacion/crear-curso";
import { actualizarCurso, ActualizarCursoDTO } from "@/modulos/cursos/aplicacion/actualizar-curso";
import { eliminarCurso } from "@/modulos/cursos/aplicacion/eliminar-curso";
import { CursoProps } from "@/modulos/cursos/dominio/curso";
import { requerirRol } from "@/compartido/lib/autorizacion";
import { ROLES } from "@/config/constantes";

export async function accionListarCursos(): Promise<CursoProps[]> {
  if (!(await requerirRol(ROLES.ADMIN))) return [];
  const repositorio = new CursoRepositorioMongo();
  const resultado = await listarCursos(repositorio);
  if (!resultado.ok) return [];
  return resultado.value.map((c) => c.toPlainObject());
}

export async function accionCrearCurso(datos: CrearCursoDTO): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new CursoRepositorioMongo();
  const resultado = await crearCurso(datos, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Curso creado correctamente" };
}

export async function accionActualizarCurso(datos: ActualizarCursoDTO): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new CursoRepositorioMongo();
  const resultado = await actualizarCurso(datos, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Curso actualizado correctamente" };
}

export async function accionEliminarCurso(id: string): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new CursoRepositorioMongo();
  const resultado = await eliminarCurso(id, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Curso eliminado correctamente" };
}
