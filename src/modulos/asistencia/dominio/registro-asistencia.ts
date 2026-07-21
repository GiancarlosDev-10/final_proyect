import { ErrorDominio } from "@/compartido/dominio/errores";
import { EstadoAsistencia } from "@/config/constantes";

export class RegistroAsistenciaNoEncontradoError extends ErrorDominio {
  readonly codigo = "REGISTRO_ASISTENCIA_NO_ENCONTRADO";
  constructor(id: string) {
    super(`No se encontró el registro de asistencia con id "${id}".`);
  }
}

export class JustificacionInvalidaError extends ErrorDominio {
  readonly codigo = "JUSTIFICACION_INVALIDA";
  constructor() {
    super("Solo se puede justificar a un alumno cuyo estado actual es Ausente.");
  }
}

export interface RegistroAsistenciaProps {
  id: string;
  sesionId: string;
  estudianteId: string;
  estado: EstadoAsistencia;
  bloqueado: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export class RegistroAsistencia {
  readonly id: string;
  readonly sesionId: string;
  readonly estudianteId: string;
  readonly estado: EstadoAsistencia;
  readonly bloqueado: boolean;
  readonly creadoEn: string;
  readonly actualizadoEn: string;

  constructor(props: RegistroAsistenciaProps) {
    this.id = props.id;
    this.sesionId = props.sesionId;
    this.estudianteId = props.estudianteId;
    this.estado = props.estado;
    this.bloqueado = props.bloqueado;
    this.creadoEn = props.creadoEn;
    this.actualizadoEn = props.actualizadoEn;
  }

  toPlainObject(): RegistroAsistenciaProps {
    return {
      id: this.id,
      sesionId: this.sesionId,
      estudianteId: this.estudianteId,
      estado: this.estado,
      bloqueado: this.bloqueado,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
    };
  }
}
