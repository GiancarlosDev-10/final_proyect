import { ErrorDominio } from "@/compartido/dominio/errores";

export class AreaNoEncontradaError extends ErrorDominio {
  readonly codigo = "AREA_NO_ENCONTRADA";
  constructor(id: string) {
    super(`No se encontró el área con id "${id}".`);
  }
}

export interface AreaProps {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export class Area {
  readonly id: string;
  readonly nombre: string;
  readonly descripcion?: string;
  readonly activo: boolean;
  readonly creadoEn: string;
  readonly actualizadoEn: string;

  constructor(props: AreaProps) {
    this.id = props.id;
    this.nombre = props.nombre;
    this.descripcion = props.descripcion;
    this.activo = props.activo;
    this.creadoEn = props.creadoEn;
    this.actualizadoEn = props.actualizadoEn;
  }

  toPlainObject(): AreaProps {
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
