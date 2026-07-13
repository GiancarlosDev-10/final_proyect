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

export class PasswordActualIncorrectaError extends ErrorDominio {
  readonly codigo = "PASSWORD_ACTUAL_INCORRECTA";
  constructor() {
    super("La contraseña actual no es correcta.");
  }
}

export class PinTelegramInvalidoError extends ErrorDominio {
  readonly codigo = "PIN_TELEGRAM_INVALIDO";
  constructor(errores: string[]) {
    super(`El PIN no es válido: ${errores.join(" ")}`);
  }
}

export interface UsuarioProps {
  id: string;
  email: string;
  passwordHash: string;
  rol: Rol;
  nombreCompleto: string;
  activo: boolean;
  /** Hash del PIN usado para identificarse en el bot de Telegram; independiente de passwordHash. */
  pinTelegramHash?: string;
  /** Bloc de notas libres, privado: solo el propio usuario lo ve. */
  notasPersonales?: string;
  creadoEn: string;
  actualizadoEn: string;
}

/** Vista para administración: nunca expone hashes ni las notas privadas del usuario. */
export type UsuarioPublico = Omit<UsuarioProps, "passwordHash" | "pinTelegramHash" | "notasPersonales"> & {
  tienePinTelegram: boolean;
};

/** Vista de "Mi perfil": la ve únicamente el dueño de la cuenta, incluye sus notas privadas. */
export type UsuarioPerfilPropio = Omit<UsuarioProps, "passwordHash" | "pinTelegramHash"> & {
  tienePinTelegram: boolean;
};

export class Usuario {
  readonly id: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly rol: Rol;
  readonly nombreCompleto: string;
  readonly activo: boolean;
  readonly pinTelegramHash?: string;
  readonly notasPersonales?: string;
  readonly creadoEn: string;
  readonly actualizadoEn: string;

  constructor(props: UsuarioProps) {
    this.id = props.id;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.rol = props.rol;
    this.nombreCompleto = props.nombreCompleto;
    this.activo = props.activo;
    this.pinTelegramHash = props.pinTelegramHash;
    this.notasPersonales = props.notasPersonales;
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
      pinTelegramHash: this.pinTelegramHash,
      notasPersonales: this.notasPersonales,
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
      tienePinTelegram: Boolean(this.pinTelegramHash),
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
    };
  }

  toPlainObjectPerfilPropio(): UsuarioPerfilPropio {
    return {
      id: this.id,
      email: this.email,
      rol: this.rol,
      nombreCompleto: this.nombreCompleto,
      activo: this.activo,
      notasPersonales: this.notasPersonales,
      tienePinTelegram: Boolean(this.pinTelegramHash),
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
    };
  }
}