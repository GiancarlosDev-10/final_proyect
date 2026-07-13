import { ErrorDominio } from "@/compartido/dominio/errores";

export class TelegramChatNoEncontradoError extends ErrorDominio {
  readonly codigo = "TELEGRAM_CHAT_NO_ENCONTRADO";
  constructor() {
    super("Este chat de Telegram no está vinculado a ningún profesor todavía. Envía tu PIN para vincularlo.");
  }
}

export interface TelegramChatProps {
  chatId: string;
  profesorId: string;
  creadoEn: string;
  actualizadoEn: string;
}

/** Vincula un chat de Telegram con el profesor identificado por su PIN. */
export class TelegramChat {
  readonly chatId: string;
  readonly profesorId: string;
  readonly creadoEn: string;
  readonly actualizadoEn: string;

  constructor(props: TelegramChatProps) {
    this.chatId = props.chatId;
    this.profesorId = props.profesorId;
    this.creadoEn = props.creadoEn;
    this.actualizadoEn = props.actualizadoEn;
  }

  toPlainObject(): TelegramChatProps {
    return {
      chatId: this.chatId,
      profesorId: this.profesorId,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
    };
  }
}
