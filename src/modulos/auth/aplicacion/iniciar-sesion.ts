import bcrypt from "bcryptjs";
import { IUsuarioRepositorio } from "@/modulos/usuarios/aplicacion/i-usuario-repositorio";
import { CredencialesInvalidasError, UsuarioInactivoError } from "@/modulos/auth/dominio/errores";
import { Result, ok, err } from "@/compartido/lib/result";
import { Usuario } from "@/modulos/usuarios/dominio/usuario";

export async function iniciarSesion(
  email: string,
  password: string,
  repositorio: IUsuarioRepositorio
): Promise<Result<Usuario>> {
  const usuario = await repositorio.buscarPorEmail(email);

  if (!usuario) {
    return err(new CredencialesInvalidasError());
  }

  if (!usuario.activo) {
    return err(new UsuarioInactivoError());
  }

  const passwordValida = await bcrypt.compare(password, usuario.passwordHash);

  if (!passwordValida) {
    return err(new CredencialesInvalidasError());
  }

  return ok(usuario);
}