import { ErrorDominio } from "@/compartido/dominio/errores";

export class AsignacionNoEncontradaError extends ErrorDominio {
  readonly codigo = "ASIGNACION_NO_ENCONTRADA";
  constructor(id: string) {
    super(`No se encontró la asignación con id "${id}".`);
  }
}

export class AsignacionInactivaError extends ErrorDominio {
  readonly codigo = "ASIGNACION_INACTIVA";
  constructor() {
    super("El profesor no tiene una asignación activa para este curso y sección.");
  }
}

export interface AsignacionProps {
  id: string;
  profesorId: string;
  cursoId: string;
  seccionId: string;
  periodoId: string;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export class Asignacion {
  readonly id: string;
  readonly profesorId: string;
  readonly cursoId: string;
  readonly seccionId: string;
  readonly periodoId: string;
  readonly activo: boolean;
  readonly creadoEn: string;
  readonly actualizadoEn: string;

  constructor(props: AsignacionProps) {
    this.id = props.id;
    this.profesorId = props.profesorId;
    this.cursoId = props.cursoId;
    this.seccionId = props.seccionId;
    this.periodoId = props.periodoId;
    this.activo = props.activo;
    this.creadoEn = props.creadoEn;
    this.actualizadoEn = props.actualizadoEn;
  }

  toPlainObject(): AsignacionProps {
    return {
      id: this.id,
      profesorId: this.profesorId,
      cursoId: this.cursoId,
      seccionId: this.seccionId,
      periodoId: this.periodoId,
      activo: this.activo,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
    };
  }
}