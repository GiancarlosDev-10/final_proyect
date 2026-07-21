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
  /** Foto para el enrolamiento facial. null hasta que el admin la sube. */
  fotoBase64: string | null;
  fotoContentType: string | null;
  /** Vector de 128 floats que calcula el script de Python (face_recognition/dlib); Node nunca lo calcula, solo lo guarda. */
  encodingFacial: number[] | null;
  encodingActualizadoEn: string | null;
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
  readonly fotoBase64: string | null;
  readonly fotoContentType: string | null;
  readonly encodingFacial: number[] | null;
  readonly encodingActualizadoEn: string | null;
  readonly creadoEn: string;
  readonly actualizadoEn: string;

  constructor(props: EstudianteProps) {
    this.id = props.id;
    this.documento = props.documento;
    this.nombreCompleto = props.nombreCompleto;
    this.fechaNacimiento = props.fechaNacimiento;
    this.apoderado = props.apoderado;
    this.activo = props.activo;
    this.fotoBase64 = props.fotoBase64;
    this.fotoContentType = props.fotoContentType;
    this.encodingFacial = props.encodingFacial;
    this.encodingActualizadoEn = props.encodingActualizadoEn;
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
      fotoBase64: this.fotoBase64,
      fotoContentType: this.fotoContentType,
      encodingFacial: this.encodingFacial,
      encodingActualizadoEn: this.encodingActualizadoEn,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
    };
  }
}