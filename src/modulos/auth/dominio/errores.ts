import { ErrorDominio } from "@/compartido/dominio/errores";

export class CredencialesInvalidasError extends ErrorDominio {
  readonly codigo = "CREDENCIALES_INVALIDAS";
  constructor() {
    super("Email o contraseña incorrectos.");
  }
}

export class UsuarioInactivoError extends ErrorDominio {
  readonly codigo = "USUARIO_INACTIVO";
  constructor() {
    super("El usuario está inactivo.");
  }
}