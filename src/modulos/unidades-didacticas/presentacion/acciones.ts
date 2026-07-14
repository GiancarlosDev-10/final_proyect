"use server";

import { UnidadDidacticaRepositorioMongo } from "@/modulos/unidades-didacticas/infraestructura/unidad-didactica-repositorio-mongo";
import { PeriodoRepositorioMongo } from "@/modulos/periodos/infraestructura/periodo-repositorio-mongo";
import { CursoRepositorioMongo } from "@/modulos/cursos/infraestructura/curso-repositorio-mongo";
import { listarUnidadesDidacticas } from "@/modulos/unidades-didacticas/aplicacion/listar-unidades-didacticas";
import { generarUnidadesDidacticas, GenerarUnidadesDidacticasDTO } from "@/modulos/unidades-didacticas/aplicacion/generar-unidades-didacticas";
import { actualizarUnidadDidactica, ActualizarUnidadDidacticaDTO } from "@/modulos/unidades-didacticas/aplicacion/actualizar-unidad-didactica";
import { abrirUnidadDidactica } from "@/modulos/unidades-didacticas/aplicacion/abrir-unidad-didactica";
import { cerrarUnidadDidactica } from "@/modulos/unidades-didacticas/aplicacion/cerrar-unidad-didactica";
import { UnidadDidacticaProps } from "@/modulos/unidades-didacticas/dominio/unidad-didactica";
import { CursoProps } from "@/modulos/cursos/dominio/curso";
import { requerirRol } from "@/compartido/lib/autorizacion";
import { ROLES } from "@/config/constantes";

export async function accionListarUnidadesDidacticas(): Promise<UnidadDidacticaProps[]> {
  if (!(await requerirRol(ROLES.ADMIN))) return [];
  const repositorio = new UnidadDidacticaRepositorioMongo();
  const resultado = await listarUnidadesDidacticas(repositorio);
  if (!resultado.ok) return [];
  return resultado.value.map((u) => u.toPlainObject());
}

export async function accionListarCursosParaUnidadesDidacticas(): Promise<CursoProps[]> {
  if (!(await requerirRol(ROLES.ADMIN))) return [];
  const repositorio = new CursoRepositorioMongo();
  const todos = await repositorio.listar();
  return todos.map((c) => c.toPlainObject());
}

export async function accionGenerarUnidadesDidacticas(datos: GenerarUnidadesDidacticasDTO): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new UnidadDidacticaRepositorioMongo();
  const periodoRepositorio = new PeriodoRepositorioMongo();
  const resultado = await generarUnidadesDidacticas(datos, repositorio, periodoRepositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Unidades didácticas generadas correctamente" };
}

export async function accionActualizarUnidadDidactica(datos: ActualizarUnidadDidacticaDTO): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new UnidadDidacticaRepositorioMongo();
  const resultado = await actualizarUnidadDidactica(datos, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Unidad didáctica actualizada correctamente" };
}

export async function accionAbrirUnidadDidactica(id: string): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new UnidadDidacticaRepositorioMongo();
  const resultado = await abrirUnidadDidactica(id, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Unidad didáctica abierta correctamente" };
}

export async function accionCerrarUnidadDidactica(id: string): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new UnidadDidacticaRepositorioMongo();
  const resultado = await cerrarUnidadDidactica(id, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Unidad didáctica cerrada correctamente" };
}
