import { IUsuarioRepositorio } from "@/modulos/usuarios/aplicacion/i-usuario-repositorio";
import { Usuario } from "@/modulos/usuarios/dominio/usuario";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";

export async function listarUsuarios(
  repositorio: IUsuarioRepositorio
): Promise<Result<Usuario[]>> {
  try {
    const usuarios = await repositorio.listar();
    return ok(usuarios);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}