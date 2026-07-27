import { ErrorDominio } from "@/compartido/dominio/errores";

export const MINUTOS_EXPIRACION_CODIGO_APODERADO = 15;

export class EstudianteSinEmailApoderadoError extends ErrorDominio {
  readonly codigo = "SIN_EMAIL_APODERADO";
  constructor() {
    super("Este alumno no tiene un email de apoderado registrado. Pide al colegio que lo actualice.");
  }
}

export class CodigoApoderadoNoEncontradoError extends ErrorDominio {
  readonly codigo = "CODIGO_NO_ENCONTRADO";
  constructor() {
    super("No hay una vinculación en curso para este chat. Escribe primero el DNI del alumno.");
  }
}

export class CodigoApoderadoExpiradoError extends ErrorDominio {
  readonly codigo = "CODIGO_EXPIRADO";
  constructor() {
    super("El código expiró. Vuelve a escribir el DNI del alumno para generar uno nuevo.");
  }
}

export class CodigoApoderadoIncorrectoError extends ErrorDominio {
  readonly codigo = "CODIGO_INCORRECTO";
  constructor() {
    super("El código ingresado no es correcto.");
  }
}

export interface CodigoApoderadoProps {
  chatId: string;
  estudianteId: string;
  codigo: string;
  expiresAt: string;
  creadoEn: string;
}

/**
 * Código de verificación de un solo uso (segundo factor, enviado por email al
 * apoderado ya registrado) para completar la vinculación chatId↔estudiante
 * iniciada con el DNI. Vive 15 minutos; un chat solo puede tener un código
 * pendiente a la vez (se sobreescribe si pide uno nuevo).
 */
export class CodigoApoderado {
  readonly chatId: string;
  readonly estudianteId: string;
  readonly codigo: string;
  readonly expiresAt: string;
  readonly creadoEn: string;

  constructor(props: CodigoApoderadoProps) {
    this.chatId = props.chatId;
    this.estudianteId = props.estudianteId;
    this.codigo = props.codigo;
    this.expiresAt = props.expiresAt;
    this.creadoEn = props.creadoEn;
  }

  estaExpirado(ahora: Date): boolean {
    return new Date(this.expiresAt).getTime() <= ahora.getTime();
  }

  toPlainObject(): CodigoApoderadoProps {
    return {
      chatId: this.chatId,
      estudianteId: this.estudianteId,
      codigo: this.codigo,
      expiresAt: this.expiresAt,
      creadoEn: this.creadoEn,
    };
  }
}
