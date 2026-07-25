import { ErrorDominio } from "@/compartido/dominio/errores";

export const MAX_INTENTOS_FALLIDOS_LOGIN = 5;
export const MINUTOS_BLOQUEO_LOGIN = 15;

export class CuentaBloqueadaError extends ErrorDominio {
  readonly codigo = "CUENTA_BLOQUEADA";
  constructor(bloqueadoHasta: string) {
    super(`Demasiados intentos fallidos. Intenta de nuevo después de ${bloqueadoHasta}.`);
  }
}

export interface LoginIntentoProps {
  email: string;
  intentosFallidos: number;
  bloqueadoHasta?: string;
  actualizadoEn: string;
}

/** Controla los intentos fallidos de login por email para frenar fuerza bruta. */
export class LoginIntento {
  readonly email: string;
  readonly intentosFallidos: number;
  readonly bloqueadoHasta?: string;
  readonly actualizadoEn: string;

  constructor(props: LoginIntentoProps) {
    this.email = props.email;
    this.intentosFallidos = props.intentosFallidos;
    this.bloqueadoHasta = props.bloqueadoHasta;
    this.actualizadoEn = props.actualizadoEn;
  }

  estaBloqueado(ahora: Date): boolean {
    if (!this.bloqueadoHasta) return false;
    return new Date(this.bloqueadoHasta).getTime() > ahora.getTime();
  }

  toPlainObject(): LoginIntentoProps {
    return {
      email: this.email,
      intentosFallidos: this.intentosFallidos,
      bloqueadoHasta: this.bloqueadoHasta,
      actualizadoEn: this.actualizadoEn,
    };
  }
}
