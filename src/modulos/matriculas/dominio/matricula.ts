import { ErrorDominio } from "@/compartido/dominio/errores";

export class MatriculaNoEncontradaError extends ErrorDominio {
  readonly codigo = "MATRICULA_NO_ENCONTRADA";
  constructor(id: string) {
    super(`No se encontró la matrícula con id "${id}".`);
  }
}

export class MatriculaDuplicadaError extends ErrorDominio {
  readonly codigo = "MATRICULA_DUPLICADA";
  constructor() {
    super("El estudiante ya tiene una matrícula para este año.");
  }
}

export interface MatriculaProps {
  id: string;
  estudianteId: string;
  seccionId: string;
  anio: number;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export class Matricula {
  readonly id: string;
  readonly estudianteId: string;
  readonly seccionId: string;
  readonly anio: number;
  readonly activo: boolean;
  readonly creadoEn: string;
  readonly actualizadoEn: string;

  constructor(props: MatriculaProps) {
    this.id = props.id;
    this.estudianteId = props.estudianteId;
    this.seccionId = props.seccionId;
    this.anio = props.anio;
    this.activo = props.activo;
    this.creadoEn = props.creadoEn;
    this.actualizadoEn = props.actualizadoEn;
  }

  toPlainObject(): MatriculaProps {
    return {
      id: this.id,
      estudianteId: this.estudianteId,
      seccionId: this.seccionId,
      anio: this.anio,
      activo: this.activo,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
    };
  }
}