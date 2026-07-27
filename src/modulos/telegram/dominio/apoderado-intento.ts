import { ErrorDominio } from "@/compartido/dominio/errores";

export const MAX_INTENTOS_FALLIDOS_APODERADO = 5;
export const MINUTOS_BLOQUEO_APODERADO = 15;

export class ChatApoderadoBloqueadoError extends ErrorDominio {
  readonly codigo = "CHAT_BLOQUEADO";
  constructor(bloqueadoHasta: string) {
    super(`Demasiados intentos fallidos. Este chat está bloqueado hasta ${bloqueadoHasta}.`);
  }
}

export interface ApoderadoIntentoProps {
  chatId: string;
  intentosFallidos: number;
  bloqueadoHasta?: string;
  actualizadoEn: string;
}

/**
 * Controla los intentos fallidos del flujo de vinculación del apoderado
 * (DNI equivocado al iniciar, o código de 6 dígitos equivocado al verificar)
 * para frenar fuerza bruta — mismo patrón que TelegramIntento (PIN de
 * profesores) y LoginIntento, pero en una colección propia porque protege un
 * paso distinto del mismo bot.
 */
export class ApoderadoIntento {
  readonly chatId: string;
  readonly intentosFallidos: number;
  readonly bloqueadoHasta?: string;
  readonly actualizadoEn: string;

  constructor(props: ApoderadoIntentoProps) {
    this.chatId = props.chatId;
    this.intentosFallidos = props.intentosFallidos;
    this.bloqueadoHasta = props.bloqueadoHasta;
    this.actualizadoEn = props.actualizadoEn;
  }

  estaBloqueado(ahora: Date): boolean {
    if (!this.bloqueadoHasta) return false;
    return new Date(this.bloqueadoHasta).getTime() > ahora.getTime();
  }

  toPlainObject(): ApoderadoIntentoProps {
    return {
      chatId: this.chatId,
      intentosFallidos: this.intentosFallidos,
      bloqueadoHasta: this.bloqueadoHasta,
      actualizadoEn: this.actualizadoEn,
    };
  }
}
