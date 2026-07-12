import { ErrorDominio } from "@/compartido/dominio/errores";

export class EstudianteNoEncontradoError extends ErrorDominio {
  readonly codigo = "ESTUDIANTE_NO_ENCONTRADO";
  constructor(id: string) {
    super(`No se encontró el estudiante con id "${id}".`);
  }
}

export interface ApoderadoProps {
  nombre: string;
  telefono: string;
  parentesco: string;
}

export interface EstudianteProps {
  id: string;
  documento: string;
  nombreCompleto: string;
  fechaNacimiento: string;
  apoderado: ApoderadoProps;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export class Estudiante {
  readonly id: string;
  readonly documento: string;
  readonly nombreCompleto: string;
  readonly fechaNacimiento: string;
  readonly apoderado: ApoderadoProps;
  readonly activo: boolean;
  readonly creadoEn: string;
  readonly actualizadoEn: string;

  constructor(props: EstudianteProps) {
    this.id = props.id;
    this.documento = props.documento;
    this.nombreCompleto = props.nombreCompleto;
    this.fechaNacimiento = props.fechaNacimiento;
    this.apoderado = props.apoderado;
    this.activo = props.activo;
    this.creadoEn = props.creadoEn;
    this.actualizadoEn = props.actualizadoEn;
  }

  toPlainObject(): EstudianteProps {
    return {
      id: this.id,
      documento: this.documento,
      nombreCompleto: this.nombreCompleto,
      fechaNacimiento: this.fechaNacimiento,
      apoderado: this.apoderado,
      activo: this.activo,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
    };
  }
}