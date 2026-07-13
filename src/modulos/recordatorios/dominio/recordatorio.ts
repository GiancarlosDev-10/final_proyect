import { ErrorDominio } from "@/compartido/dominio/errores";
import { TipoRecordatorio } from "@/config/constantes";

export class RecordatorioNoEncontradoError extends ErrorDominio {
  readonly codigo = "RECORDATORIO_NO_ENCONTRADO";
  constructor(id: string) {
    super(`No se encontró el recordatorio con id "${id}".`);
  }
}

export class RangoHorarioRecordatorioInvalidoError extends ErrorDominio {
  readonly codigo = "RANGO_HORARIO_RECORDATORIO_INVALIDO";
  constructor() {
    super("La hora de inicio debe ser anterior a la hora de fin.");
  }
}

export interface RecordatorioProps {
  id: string;
  profesorId: string;
  fecha: string;
  titulo: string;
  descripcion?: string;
  tipo: TipoRecordatorio;
  horaInicio?: string;
  horaFin?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export class Recordatorio {
  readonly id: string;
  readonly profesorId: string;
  readonly fecha: string;
  readonly titulo: string;
  readonly descripcion?: string;
  readonly tipo: TipoRecordatorio;
  readonly horaInicio?: string;
  readonly horaFin?: string;
  readonly creadoEn: string;
  readonly actualizadoEn: string;

  constructor(props: RecordatorioProps) {
    if (props.horaInicio && props.horaFin && props.horaInicio >= props.horaFin) {
      throw new RangoHorarioRecordatorioInvalidoError();
    }
    this.id = props.id;
    this.profesorId = props.profesorId;
    this.fecha = props.fecha;
    this.titulo = props.titulo;
    this.descripcion = props.descripcion;
    this.tipo = props.tipo;
    this.horaInicio = props.horaInicio;
    this.horaFin = props.horaFin;
    this.creadoEn = props.creadoEn;
    this.actualizadoEn = props.actualizadoEn;
  }

  /** Recordatorios sin horaInicio/horaFin no tienen una hora asignada en el horario todavía. */
  tieneHoraAsignada(): boolean {
    return Boolean(this.horaInicio && this.horaFin);
  }

  toPlainObject(): RecordatorioProps {
    return {
      id: this.id,
      profesorId: this.profesorId,
      fecha: this.fecha,
      titulo: this.titulo,
      descripcion: this.descripcion,
      tipo: this.tipo,
      horaInicio: this.horaInicio,
      horaFin: this.horaFin,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
    };
  }
}
