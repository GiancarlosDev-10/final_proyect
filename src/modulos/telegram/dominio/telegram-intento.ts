import { ErrorDominio } from "@/compartido/dominio/errores";

export const MAX_INTENTOS_FALLIDOS = 5;
export const MINUTOS_BLOQUEO = 15;

export class PinIncorrectoError extends ErrorDominio {
  readonly codigo = "PIN_INCORRECTO";
  constructor(intentosRestantes: number) {
    super(`PIN incorrecto. Te quedan ${intentosRestantes} intento(s) antes de bloquear este chat.`);
  }
}

export class ChatBloqueadoError extends ErrorDominio {
  readonly codigo = "CHAT_BLOQUEADO";
  constructor(bloqueadoHasta: string) {
    super(`Demasiados intentos fallidos. Este chat está bloqueado hasta ${bloqueadoHasta}.`);
  }
}

export interface TelegramIntentoProps {
  chatId: string;
  intentosFallidos: number;
  bloqueadoHasta?: string;
  actualizadoEn: string;
}

/** Controla los intentos fallidos de PIN por chat de Telegram para frenar fuerza bruta. */
export class TelegramIntento {
  readonly chatId: string;
  readonly intentosFallidos: number;
  readonly bloqueadoHasta?: string;
  readonly actualizadoEn: string;

  constructor(props: TelegramIntentoProps) {
    this.chatId = props.chatId;
    this.intentosFallidos = props.intentosFallidos;
    this.bloqueadoHasta = props.bloqueadoHasta;
    this.actualizadoEn = props.actualizadoEn;
  }

  estaBloqueado(ahora: Date): boolean {
    if (!this.bloqueadoHasta) return false;
    return new Date(this.bloqueadoHasta).getTime() > ahora.getTime();
  }

  toPlainObject(): TelegramIntentoProps {
    return {
      chatId: this.chatId,
      intentosFallidos: this.intentosFallidos,
      bloqueadoHasta: this.bloqueadoHasta,
      actualizadoEn: this.actualizadoEn,
    };
  }
}
