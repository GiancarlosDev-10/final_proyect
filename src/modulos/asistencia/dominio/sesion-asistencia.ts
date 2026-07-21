import { ErrorDominio } from "@/compartido/dominio/errores";

export class SesionAsistenciaNoEncontradaError extends ErrorDominio {
  readonly codigo = "SESION_ASISTENCIA_NO_ENCONTRADA";
  constructor(id: string) {
    super(`No se encontró la sesión de asistencia con id "${id}".`);
  }
}

export class UmbralesSesionInvalidosError extends ErrorDominio {
  readonly codigo = "UMBRALES_SESION_INVALIDOS";
  constructor() {
    super("Los umbrales deben cumplir horaEntrada ≤ horaLimiteTardanza ≤ horaCierre.");
  }
}

export interface SesionAsistenciaProps {
  id: string;
  bloqueHorarioId: string;
  fecha: string;
  horaEntrada: string;
  horaLimiteTardanza: string;
  horaCierre: string;
  creadoEn: string;
  actualizadoEn: string;
}

export class SesionAsistencia {
  readonly id: string;
  readonly bloqueHorarioId: string;
  readonly fecha: string;
  readonly horaEntrada: string;
  readonly horaLimiteTardanza: string;
  readonly horaCierre: string;
  readonly creadoEn: string;
  readonly actualizadoEn: string;

  constructor(props: SesionAsistenciaProps) {
    if (props.horaEntrada > props.horaLimiteTardanza || props.horaLimiteTardanza > props.horaCierre) {
      throw new UmbralesSesionInvalidosError();
    }
    this.id = props.id;
    this.bloqueHorarioId = props.bloqueHorarioId;
    this.fecha = props.fecha;
    this.horaEntrada = props.horaEntrada;
    this.horaLimiteTardanza = props.horaLimiteTardanza;
    this.horaCierre = props.horaCierre;
    this.creadoEn = props.creadoEn;
    this.actualizadoEn = props.actualizadoEn;
  }

  toPlainObject(): SesionAsistenciaProps {
    return {
      id: this.id,
      bloqueHorarioId: this.bloqueHorarioId,
      fecha: this.fecha,
      horaEntrada: this.horaEntrada,
      horaLimiteTardanza: this.horaLimiteTardanza,
      horaCierre: this.horaCierre,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
    };
  }
}
