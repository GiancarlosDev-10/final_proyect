"use server";

import { PeriodoRepositorioMongo } from "@/modulos/periodos/infraestructura/periodo-repositorio-mongo";
import { UnidadDidacticaRepositorioMongo } from "@/modulos/unidades-didacticas/infraestructura/unidad-didactica-repositorio-mongo";
import { listarPeriodos } from "@/modulos/periodos/aplicacion/listar-periodos";
import { crearPeriodo, CrearPeriodoDTO } from "@/modulos/periodos/aplicacion/crear-periodo";
import { generarPeriodosAnio, GenerarPeriodosAnioDTO } from "@/modulos/periodos/aplicacion/generar-periodos-anio";
import { actualizarPeriodo, ActualizarPeriodoDTO } from "@/modulos/periodos/aplicacion/actualizar-periodo";
import { abrirPeriodo } from "@/modulos/periodos/aplicacion/abrir-periodo";
import { cerrarPeriodo } from "@/modulos/periodos/aplicacion/cerrar-periodo";
import { PeriodoProps } from "@/modulos/periodos/dominio/periodo";
import { requerirRol } from "@/compartido/lib/autorizacion";
import { ROLES } from "@/config/constantes";

export async function accionListarPeriodos(): Promise<PeriodoProps[]> {
  if (!(await requerirRol(ROLES.ADMIN))) return [];
  const repositorio = new PeriodoRepositorioMongo();
  const resultado = await listarPeriodos(repositorio);
  if (!resultado.ok) return [];
  return resultado.value.map((p) => p.toPlainObject());
}

export async function accionCrearPeriodo(datos: CrearPeriodoDTO): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new PeriodoRepositorioMongo();
  const resultado = await crearPeriodo(datos, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Periodo creado correctamente" };
}

export async function accionGenerarPeriodosAnio(datos: GenerarPeriodosAnioDTO): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new PeriodoRepositorioMongo();
  const resultado = await generarPeriodosAnio(datos, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Periodos del año generados correctamente" };
}

export async function accionActualizarPeriodo(datos: ActualizarPeriodoDTO): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new PeriodoRepositorioMongo();
  const resultado = await actualizarPeriodo(datos, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Periodo actualizado correctamente" };
}

export async function accionAbrirPeriodo(id: string): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new PeriodoRepositorioMongo();
  const resultado = await abrirPeriodo(id, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Periodo abierto correctamente" };
}

export async function accionCerrarPeriodo(id: string): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new PeriodoRepositorioMongo();
  const unidadDidacticaRepositorio = new UnidadDidacticaRepositorioMongo();
  const resultado = await cerrarPeriodo(id, repositorio, unidadDidacticaRepositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Periodo cerrado correctamente" };
}
