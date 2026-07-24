import { ErrorDominio } from "@/compartido/dominio/errores";
import { NivelEducativo } from "@/config/constantes";

export class SeccionNoEncontradaError extends ErrorDominio {
  readonly codigo = "SECCION_NO_ENCONTRADA";
  constructor(id: string) {
    super(`No se encontró la sección con id "${id}".`);
  }
}

export interface SeccionProps {
  id: string;
  nombre: string;
  grado: string;
  nivel: NivelEducativo;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export class Seccion {
  readonly id: string;
  readonly nombre: string;
  readonly grado: string;
  readonly nivel: NivelEducativo;
  readonly activo: boolean;
  readonly creadoEn: string;
  readonly actualizadoEn: string;

  constructor(props: SeccionProps) {
    this.id = props.id;
    this.nombre = props.nombre;
    this.grado = props.grado;
    this.nivel = props.nivel;
    this.activo = props.activo;
    this.creadoEn = props.creadoEn;
    this.actualizadoEn = props.actualizadoEn;
  }

  toPlainObject(): SeccionProps {
    return {
      id: this.id,
      nombre: this.nombre,
      grado: this.grado,
      nivel: this.nivel,
      activo: this.activo,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
    };
  }
}