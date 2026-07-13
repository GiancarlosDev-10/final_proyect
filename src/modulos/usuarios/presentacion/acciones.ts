"use server";

import { UsuarioRepositorioMongo } from "@/modulos/usuarios/infraestructura/usuario-repositorio-mongo";
import { listarUsuarios } from "@/modulos/usuarios/aplicacion/listar-usuarios";
import { crearUsuario, CrearUsuarioDTO } from "@/modulos/usuarios/aplicacion/crear-usuario";
import { actualizarUsuario, ActualizarUsuarioDTO } from "@/modulos/usuarios/aplicacion/actualizar-usuario";
import { desactivarUsuario } from "@/modulos/usuarios/aplicacion/desactivar-usuario";
import { activarUsuario } from "@/modulos/usuarios/aplicacion/activar-usuario";
import { UsuarioPublico } from "@/modulos/usuarios/dominio/usuario";
import { requerirRol } from "@/compartido/lib/autorizacion";
import { ROLES } from "@/config/constantes";

export async function accionListarUsuarios(): Promise<UsuarioPublico[]> {
  if (!(await requerirRol(ROLES.ADMIN))) return [];
  const repositorio = new UsuarioRepositorioMongo();
  const resultado = await listarUsuarios(repositorio);
  if (!resultado.ok) return [];
  return resultado.value.map((u) => u.toPlainObjectPublico());
}

export async function accionCrearUsuario(datos: CrearUsuarioDTO): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new UsuarioRepositorioMongo();
  const resultado = await crearUsuario(datos, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Usuario creado correctamente" };
}

export async function accionActualizarUsuario(datos: ActualizarUsuarioDTO): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new UsuarioRepositorioMongo();
  const resultado = await actualizarUsuario(datos, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Usuario actualizado correctamente" };
}

export async function accionDesactivarUsuario(id: string): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new UsuarioRepositorioMongo();
  const resultado = await desactivarUsuario(id, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Usuario desactivado correctamente" };
}

export async function accionActivarUsuario(id: string): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new UsuarioRepositorioMongo();
  const resultado = await activarUsuario(id, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Usuario activado correctamente" };
}
