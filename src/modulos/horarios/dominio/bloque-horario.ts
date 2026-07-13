import { ErrorDominio } from "@/compartido/dominio/errores";
import { DiaSemana } from "@/config/constantes";

export class BloqueHorarioNoEncontradoError extends ErrorDominio {
  readonly codigo = "BLOQUE_HORARIO_NO_ENCONTRADO";
  constructor(id: string) {
    super(`No se encontró el bloque de horario con id "${id}".`);
  }
}

export class RangoHorarioInvalidoError extends ErrorDominio {
  readonly codigo = "RANGO_HORARIO_INVALIDO";
  constructor() {
    super("La hora de inicio debe ser anterior a la hora de fin.");
  }
}

export class BloqueHorarioSuperpuestoError extends ErrorDominio {
  readonly codigo = "BLOQUE_HORARIO_SUPERPUESTO";
  constructor() {
    super("Ya tienes una clase asignada en ese día y horario.");
  }
}

export interface BloqueHorarioProps {
  id: string;
  asignacionId: string;
  profesorId: string;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
  creadoEn: string;
  actualizadoEn: string;
}

export class BloqueHorario {
  readonly id: string;
  readonly asignacionId: string;
  readonly profesorId: string;
  readonly diaSemana: DiaSemana;
  readonly horaInicio: string;
  readonly horaFin: string;
  readonly creadoEn: string;
  readonly actualizadoEn: string;

  constructor(props: BloqueHorarioProps) {
    if (props.horaInicio >= props.horaFin) {
      throw new RangoHorarioInvalidoError();
    }
    this.id = props.id;
    this.asignacionId = props.asignacionId;
    this.profesorId = props.profesorId;
    this.diaSemana = props.diaSemana;
    this.horaInicio = props.horaInicio;
    this.horaFin = props.horaFin;
    this.creadoEn = props.creadoEn;
    this.actualizadoEn = props.actualizadoEn;
  }

  /** Dos bloques se superponen si caen en el mismo día y sus rangos horarios se cruzan. */
  seSuperponeCon(diaSemana: DiaSemana, horaInicio: string, horaFin: string): boolean {
    return this.diaSemana === diaSemana && this.horaInicio < horaFin && horaInicio < this.horaFin;
  }

  toPlainObject(): BloqueHorarioProps {
    return {
      id: this.id,
      asignacionId: this.asignacionId,
      profesorId: this.profesorId,
      diaSemana: this.diaSemana,
      horaInicio: this.horaInicio,
      horaFin: this.horaFin,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
    };
  }
}
