import bcrypt from "bcryptjs";
import { IUsuarioRepositorio } from "@/modulos/usuarios/aplicacion/i-usuario-repositorio";
import { ILoginIntentoRepositorio } from "@/modulos/auth/aplicacion/i-login-intento-repositorio";
import { CredencialesInvalidasError, UsuarioInactivoError } from "@/modulos/auth/dominio/errores";
import {
  LoginIntento,
  MAX_INTENTOS_FALLIDOS_LOGIN,
  MINUTOS_BLOQUEO_LOGIN,
  CuentaBloqueadaError,
} from "@/modulos/auth/dominio/login-intento";
import { Result, ok, err } from "@/compartido/lib/result";
import { Usuario } from "@/modulos/usuarios/dominio/usuario";

// Hash bcrypt (costo 10) de una contraseña inexistente, usado solo para que
// el "no existe este email" tome un tiempo similar a una comparación real y
// no sirva para enumerar cuentas por timing.
const HASH_DUMMY_PARA_TIMING = "$2b$10$Y39Ju7j0akoDIqkDX7oB8.KMKIOn1U8xPb9bbaYNaqJ.CswTiiWsi";

function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function iniciarSesion(
  email: string,
  password: string,
  repositorio: IUsuarioRepositorio,
  intentoRepo: ILoginIntentoRepositorio
): Promise<Result<Usuario>> {
  const ahora = new Date();
  const emailKey = normalizarEmail(email);
  const usuario = await repositorio.buscarPorEmail(email);

  if (!usuario) {
    await bcrypt.compare(password, HASH_DUMMY_PARA_TIMING);
    return err(new CredencialesInvalidasError());
  }

  const intento = await intentoRepo.buscarPorEmail(emailKey);
  if (intento && intento.estaBloqueado(ahora)) {
    return err(new CuentaBloqueadaError(intento.bloqueadoHasta!));
  }

  if (!usuario.activo) {
    await bcrypt.compare(password, HASH_DUMMY_PARA_TIMING);
    return err(new UsuarioInactivoError());
  }

  const passwordValida = await bcrypt.compare(password, usuario.passwordHash);

  if (!passwordValida) {
    const intentosPrevios = intento?.intentosFallidos ?? 0;
    const intentosFallidos = intentosPrevios + 1;
    const debeBloquear = intentosFallidos >= MAX_INTENTOS_FALLIDOS_LOGIN;

    const nuevoIntento = new LoginIntento({
      email: emailKey,
      intentosFallidos: debeBloquear ? 0 : intentosFallidos,
      bloqueadoHasta: debeBloquear
        ? new Date(ahora.getTime() + MINUTOS_BLOQUEO_LOGIN * 60_000).toISOString()
        : undefined,
      actualizadoEn: ahora.toISOString(),
    });
    await intentoRepo.guardar(nuevoIntento);

    if (debeBloquear) return err(new CuentaBloqueadaError(nuevoIntento.bloqueadoHasta!));
    return err(new CredencialesInvalidasError());
  }

  if (intento) await intentoRepo.eliminar(emailKey);

  return ok(usuario);
}
