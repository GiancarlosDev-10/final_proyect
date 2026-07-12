import { ErrorDominio } from "@/compartido/dominio/errores";

export class CursoNoEncontradoError extends ErrorDominio {
  readonly codigo = "CURSO_NO_ENCONTRADO";
  constructor(id: string) {
    super(`No se encontró el curso con id "${id}".`);
  }
}

export interface CursoProps {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export class Curso {
  readonly id: string;
  readonly nombre: string;
  readonly descripcion?: string;
  readonly activo: boolean;
  readonly creadoEn: string;
  readonly actualizadoEn: string;

  constructor(props: CursoProps) {
    this.id = props.id;
    this.nombre = props.nombre;
    this.descripcion = props.descripcion;
    this.activo = props.activo;
    this.creadoEn = props.creadoEn;
    this.actualizadoEn = props.actualizadoEn;
  }

  toPlainObject(): CursoProps {
    return {
      id: this.id,
      nombre: this.nombre,
      descripcion: this.descripcion,
      activo: this.activo,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
    };
  }
}