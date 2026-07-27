export interface ApoderadoVinculadoProps {
  id: string;
  chatId: string;
  estudianteId: string;
  creadoEn: string;
}

/**
 * Vínculo confirmado entre un chat de Telegram y un estudiante, para mandar
 * notificaciones de asistencia. Es de muchos a muchos a propósito: un mismo
 * chat puede vincularse a más de un hijo/a, y un mismo estudiante puede tener
 * más de un apoderado vinculado (mamá y papá, por ejemplo) — por eso la clave
 * es un id propio, no chatId ni estudianteId solos.
 */
export class ApoderadoVinculado {
  readonly id: string;
  readonly chatId: string;
  readonly estudianteId: string;
  readonly creadoEn: string;

  constructor(props: ApoderadoVinculadoProps) {
    this.id = props.id;
    this.chatId = props.chatId;
    this.estudianteId = props.estudianteId;
    this.creadoEn = props.creadoEn;
  }

  toPlainObject(): ApoderadoVinculadoProps {
    return {
      id: this.id,
      chatId: this.chatId,
      estudianteId: this.estudianteId,
      creadoEn: this.creadoEn,
    };
  }
}
