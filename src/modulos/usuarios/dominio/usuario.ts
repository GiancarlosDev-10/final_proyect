import { Rol, ROLES } from "@/config/constantes";
import { ErrorDominio } from "@/compartido/dominio/errores";

export class EmailDuplicadoError extends ErrorDominio {
  readonly codigo = "EMAIL_DUPLICADO";
  constructor(email: string) {
    super(`Ya existe un usuario con el email "${email}".`);
  }
}

export class UsuarioNoEncontradoError extends ErrorDominio {
  readonly codigo = "USUARIO_NO_ENCONTRADO";
  constructor(id: string) {
    super(`No se encontró el usuario con id "${id}".`);
  }
}

export class PasswordDebilError extends ErrorDominio {
  readonly codigo = "PASSWORD_DEBIL";
  constructor(errores: string[]) {
    super(`La contraseña no cumple los requisitos de seguridad: ${errores.join(" ")}`);
  }
}

export interface UsuarioProps {
  id: string;
  email: string;
  passwordHash: string;
  rol: Rol;
  nombreCompleto: string;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export type UsuarioPublico = Omit<UsuarioProps, "passwordHash">;

export class Usuario {
  readonly id: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly rol: Rol;
  readonly nombreCompleto: string;
  readonly activo: boolean;
  readonly creadoEn: string;
  readonly actualizadoEn: string;

  constructor(props: UsuarioProps) {
    this.id = props.id;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.rol = props.rol;
    this.nombreCompleto = props.nombreCompleto;
    this.activo = props.activo;
    this.creadoEn = props.creadoEn;
    this.actualizadoEn = props.actualizadoEn;
  }

  isAdmin(): boolean {
    return this.rol === ROLES.ADMIN;
  }

  isProfesor(): boolean {
    return this.rol === ROLES.PROFESOR;
  }

  toPlainObject(): UsuarioProps {
    return {
      id: this.id,
      email: this.email,
      passwordHash: this.passwordHash,
      rol: this.rol,
      nombreCompleto: this.nombreCompleto,
      activo: this.activo,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
    };
  }

  toPlainObjectPublico(): UsuarioPublico {
    return {
      id: this.id,
      email: this.email,
      rol: this.rol,
      nombreCompleto: this.nombreCompleto,
      activo: this.activo,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
    };
  }
}