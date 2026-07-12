import { ErrorDominio } from "@/compartido/dominio/errores";
import { EstadoPeriodo, ESTADOS_PERIODO } from "@/config/constantes";

export class PeriodoNoEncontradoError extends ErrorDominio {
  readonly codigo = "PERIODO_NO_ENCONTRADO";
  constructor(id: string) {
    super(`No se encontró el periodo con id "${id}".`);
  }
}

export class PeriodoCerradoError extends ErrorDominio {
  readonly codigo = "PERIODO_CERRADO";
  constructor() {
    super("No se pueden modificar notas en un periodo cerrado.");
  }
}

export class RangoFechasInvalidoError extends ErrorDominio {
  readonly codigo = "RANGO_FECHAS_INVALIDO";
  constructor() {
    super("La fecha de inicio debe ser anterior a la fecha de fin.");
  }
}

export interface PeriodoProps {
  id: string;
  nombre: string;
  anio: number;
  estado: EstadoPeriodo;
  fechaInicio: string;
  fechaFin: string;
  creadoEn: string;
  actualizadoEn: string;
}

export class Periodo {
  readonly id: string;
  readonly nombre: string;
  readonly anio: number;
  readonly estado: EstadoPeriodo;
  readonly fechaInicio: string;
  readonly fechaFin: string;
  readonly creadoEn: string;
  readonly actualizadoEn: string;

  constructor(props: PeriodoProps) {
    if (new Date(props.fechaInicio).getTime() >= new Date(props.fechaFin).getTime()) {
      throw new RangoFechasInvalidoError();
    }
    this.id = props.id;
    this.nombre = props.nombre;
    this.anio = props.anio;
    this.estado = props.estado;
    this.fechaInicio = props.fechaInicio;
    this.fechaFin = props.fechaFin;
    this.creadoEn = props.creadoEn;
    this.actualizadoEn = props.actualizadoEn;
  }

  estaAbierto(): boolean {
    return this.estado === ESTADOS_PERIODO.ABIERTO;
  }

  toPlainObject(): PeriodoProps {
    return {
      id: this.id,
      nombre: this.nombre,
      anio: this.anio,
      estado: this.estado,
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
    };
  }
}