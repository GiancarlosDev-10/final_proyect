import bcrypt from "bcryptjs";
import { IUsuarioRepositorio } from "@/modulos/usuarios/aplicacion/i-usuario-repositorio";
import { Usuario, EmailDuplicadoError, PasswordDebilError } from "@/modulos/usuarios/dominio/usuario";
import { validarPassword } from "@/modulos/usuarios/dominio/politica-password";
import { Result, ok, err } from "@/compartido/lib/result";
import { generarId } from "@/compartido/lib/uuid";
import { Rol } from "@/config/constantes";

export interface CrearUsuarioDTO {
  email: string;
  password: string;
  nombreCompleto: string;
  rol: Rol;
}

export async function crearUsuario(
  datos: CrearUsuarioDTO,
  repositorio: IUsuarioRepositorio
): Promise<Result<Usuario>> {
  const erroresPassword = validarPassword(datos.password);
  if (erroresPassword.length > 0) return err(new PasswordDebilError(erroresPassword));

  const existe = await repositorio.buscarPorEmail(datos.email);
  if (existe) return err(new EmailDuplicadoError(datos.email));

  const passwordHash = await bcrypt.hash(datos.password, 10);
  const ahora = new Date().toISOString();

  const usuario = new Usuario({
    id: generarId("USR"),
    email: datos.email,
    passwordHash,
    rol: datos.rol,
    nombreCompleto: datos.nombreCompleto,
    activo: true,
    creadoEn: ahora,
    actualizadoEn: ahora,
  });

  await repositorio.crear(usuario);
  return ok(usuario);
}