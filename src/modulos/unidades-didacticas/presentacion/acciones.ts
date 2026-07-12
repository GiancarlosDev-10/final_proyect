"use server";

import { UnidadDidacticaRepositorioMongo } from "@/modulos/unidades-didacticas/infraestructura/unidad-didactica-repositorio-mongo";
import { listarUnidadesDidacticas } from "@/modulos/unidades-didacticas/aplicacion/listar-unidades-didacticas";
import { crearUnidadDidactica, CrearUnidadDidacticaDTO } from "@/modulos/unidades-didacticas/aplicacion/crear-unidad-didactica";
import { actualizarUnidadDidactica, ActualizarUnidadDidacticaDTO } from "@/modulos/unidades-didacticas/aplicacion/actualizar-unidad-didactica";
import { abrirUnidadDidactica } from "@/modulos/unidades-didacticas/aplicacion/abrir-unidad-didactica";
import { cerrarUnidadDidactica } from "@/modulos/unidades-didacticas/aplicacion/cerrar-unidad-didactica";
import { UnidadDidacticaProps } from "@/modulos/unidades-didacticas/dominio/unidad-didactica";
import { requerirRol } from "@/compartido/lib/autorizacion";
import { ROLES } from "@/config/constantes";

export async function accionListarUnidadesDidacticas(): Promise<UnidadDidacticaProps[]> {
  if (!(await requerirRol(ROLES.ADMIN))) return [];
  const repositorio = new UnidadDidacticaRepositorioMongo();
  const resultado = await listarUnidadesDidacticas(repositorio);
  if (!resultado.ok) return [];
  return resultado.value.map((u) => u.toPlainObject());
}

export async function accionCrearUnidadDidactica(datos: CrearUnidadDidacticaDTO): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new UnidadDidacticaRepositorioMongo();
  const resultado = await crearUnidadDidactica(datos, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Unidad didáctica creada correctamente" };
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
