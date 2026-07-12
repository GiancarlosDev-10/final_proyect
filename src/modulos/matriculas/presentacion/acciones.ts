"use server";

import { MatriculaRepositorioMongo } from "@/modulos/matriculas/infraestructura/matricula-repositorio-mongo";
import { EstudianteRepositorioMongo } from "@/modulos/estudiantes/infraestructura/estudiante-repositorio-mongo";
import { SeccionRepositorioMongo } from "@/modulos/secciones/infraestructura/seccion-repositorio-mongo";
import { listarMatriculas } from "@/modulos/matriculas/aplicacion/listar-matriculas";
import { crearMatricula, CrearMatriculaDTO } from "@/modulos/matriculas/aplicacion/crear-matricula";
import { actualizarMatricula, ActualizarMatriculaDTO } from "@/modulos/matriculas/aplicacion/actualizar-matricula";
import { eliminarMatricula } from "@/modulos/matriculas/aplicacion/eliminar-matricula";
import { MatriculaProps } from "@/modulos/matriculas/dominio/matricula";
import { EstudianteProps } from "@/modulos/estudiantes/dominio/estudiante";
import { SeccionProps } from "@/modulos/secciones/dominio/seccion";
import { requerirRol } from "@/compartido/lib/autorizacion";
import { ROLES } from "@/config/constantes";

export async function accionListarMatriculas(): Promise<MatriculaProps[]> {
  if (!(await requerirRol(ROLES.ADMIN))) return [];
  const repositorio = new MatriculaRepositorioMongo();
  const resultado = await listarMatriculas(repositorio);
  if (!resultado.ok) return [];
  return resultado.value.map((m) => m.toPlainObject());
}

export async function accionListarEstudiantesParaMatricula(): Promise<EstudianteProps[]> {
  if (!(await requerirRol(ROLES.ADMIN))) return [];
  const repositorio = new EstudianteRepositorioMongo();
  const resultado = await repositorio.listar();
  return resultado.map((e) => e.toPlainObject());
}

export async function accionListarSeccionesParaMatricula(): Promise<SeccionProps[]> {
  if (!(await requerirRol(ROLES.ADMIN))) return [];
  const repositorio = new SeccionRepositorioMongo();
  const resultado = await repositorio.listar();
  return resultado.map((s) => s.toPlainObject());
}

export async function accionCrearMatricula(datos: CrearMatriculaDTO): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new MatriculaRepositorioMongo();
  const resultado = await crearMatricula(datos, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Matrícula creada correctamente" };
}

export async function accionActualizarMatricula(datos: ActualizarMatriculaDTO): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new MatriculaRepositorioMongo();
  const resultado = await actualizarMatricula(datos, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Matrícula actualizada correctamente" };
}

export async function accionEliminarMatricula(id: string): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new MatriculaRepositorioMongo();
  const resultado = await eliminarMatricula(id, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Matrícula eliminada correctamente" };
}
