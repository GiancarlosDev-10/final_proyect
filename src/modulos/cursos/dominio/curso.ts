import { ErrorDominio } from "@/compartido/dominio/errores";

export class CursoNoEncontradoError extends ErrorDominio {
  readonly codigo = "CURSO_NO_ENCONTRADO";
  constructor(id: string) {
    super(`No se encontró el curso con id "${id}".`);
  }
}

export class CursoEnUsoError extends ErrorDominio {
  readonly codigo = "CURSO_EN_USO";
  constructor() {
    super(
      "No se puede eliminar el curso porque tiene Unidades Didácticas o Asignaciones registradas. Elimínalas primero."
    );
  }
}

export interface CursoProps {
  id: string;
  nombre: string;
  descripcion?: string;
  areaId?: string;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export class Curso {
  readonly id: string;
  readonly nombre: string;
  readonly descripcion?: string;
  readonly areaId?: string;
  readonly activo: boolean;
  readonly creadoEn: string;
  readonly actualizadoEn: string;

  constructor(props: CursoProps) {
    this.id = props.id;
    this.nombre = props.nombre;
    this.descripcion = props.descripcion;
    this.areaId = props.areaId;
    this.activo = props.activo;
    this.creadoEn = props.creadoEn;
    this.actualizadoEn = props.actualizadoEn;
  }

  toPlainObject(): CursoProps {
    return {
      id: this.id,
      nombre: this.nombre,
      descripcion: this.descripcion,
      areaId: this.areaId,
      activo: this.activo,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
    };
  }
}