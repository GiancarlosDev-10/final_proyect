"use server";

import { auth } from "@/auth";
import { UsuarioRepositorioMongo } from "@/modulos/usuarios/infraestructura/usuario-repositorio-mongo";
import { actualizarPerfilPropio } from "@/modulos/usuarios/aplicacion/actualizar-perfil-propio";
import { cambiarPasswordPropio } from "@/modulos/usuarios/aplicacion/cambiar-password-propio";
import { configurarPinTelegram } from "@/modulos/usuarios/aplicacion/configurar-pin-telegram";
import { quitarPinTelegram } from "@/modulos/usuarios/aplicacion/quitar-pin-telegram";
import { UsuarioPerfilPropio } from "@/modulos/usuarios/dominio/usuario";

export interface ActualizarMiPerfilInput {
  nombreCompleto: string;
  notasPersonales?: string;
}

export interface CambiarMiPasswordInput {
  passwordActual: string;
  passwordNueva: string;
}

export async function accionObtenerMiPerfil(): Promise<UsuarioPerfilPropio | null> {
  const session = await auth();
  const usuarioId = session?.user?.id;
  if (!usuarioId) return null;

  const repositorio = new UsuarioRepositorioMongo();
  const usuario = await repositorio.buscarPorId(usuarioId);
  if (!usuario) return null;
  return usuario.toPlainObjectPerfilPropio();
}

export async function accionActualizarMiPerfil(datos: ActualizarMiPerfilInput): Promise<{ ok: boolean; mensaje: string }> {
  const session = await auth();
  const usuarioId = session?.user?.id;
  if (!usuarioId) return { ok: false, mensaje: "No autorizado" };

  const repositorio = new UsuarioRepositorioMongo();
  const resultado = await actualizarPerfilPropio({ id: usuarioId, ...datos }, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Perfil actualizado correctamente" };
}

export async function accionCambiarMiPassword(datos: CambiarMiPasswordInput): Promise<{ ok: boolean; mensaje: string }> {
  const session = await auth();
  const usuarioId = session?.user?.id;
  if (!usuarioId) return { ok: false, mensaje: "No autorizado" };

  const repositorio = new UsuarioRepositorioMongo();
  const resultado = await cambiarPasswordPropio({ id: usuarioId, ...datos }, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Contraseña actualizada correctamente" };
}

export async function accionConfigurarPinTelegram(pin: string): Promise<{ ok: boolean; mensaje: string }> {
  const session = await auth();
  const usuarioId = session?.user?.id;
  if (!usuarioId) return { ok: false, mensaje: "No autorizado" };

  const repositorio = new UsuarioRepositorioMongo();
  const resultado = await configurarPinTelegram({ id: usuarioId, pin }, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "PIN de Telegram configurado correctamente" };
}

export async function accionQuitarPinTelegram(): Promise<{ ok: boolean; mensaje: string }> {
  const session = await auth();
  const usuarioId = session?.user?.id;
  if (!usuarioId) return { ok: false, mensaje: "No autorizado" };

  const repositorio = new UsuarioRepositorioMongo();
  const resultado = await quitarPinTelegram(usuarioId, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "PIN de Telegram eliminado" };
}
