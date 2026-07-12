import { ErrorDominio } from "@/compartido/dominio/errores";
import { TipoNota } from "@/config/constantes";

export class NotaNoEncontradaError extends ErrorDominio {
  readonly codigo = "NOTA_NO_ENCONTRADA";
  constructor(id: string) {
    super(`No se encontró la nota con id "${id}".`);
  }
}

export class NotaFueraDeRangoError extends ErrorDominio {
  readonly codigo = "NOTA_FUERA_DE_RANGO";
  constructor() {
    super("La nota debe estar entre 0 y 20.");
  }
}

export class NotaNoPerteneceAAsignacionError extends ErrorDominio {
  readonly codigo = "NOTA_NO_PERTENECE_A_ASIGNACION";
  constructor() {
    super("La nota no pertenece a una asignación del profesor.");
  }
}

export interface NotaProps {
  id: string;
  estudianteId: string;
  asignacionId: string;
  periodoId: string;
  tipo: TipoNota;
  etiqueta: string;
  valor: number;
  fecha: string;
  creadoEn: string;
  actualizadoEn: string;
}

export class Nota {
  readonly id: string;
  readonly estudianteId: string;
  readonly asignacionId: string;
  readonly periodoId: string;
  readonly tipo: TipoNota;
  readonly etiqueta: string;
  readonly valor: number;
  readonly fecha: string;
  readonly creadoEn: string;
  readonly actualizadoEn: string;

  constructor(props: NotaProps) {
    if (props.valor < 0 || props.valor > 20) {
      throw new NotaFueraDeRangoError();
    }
    this.id = props.id;
    this.estudianteId = props.estudianteId;
    this.asignacionId = props.asignacionId;
    this.periodoId = props.periodoId;
    this.tipo = props.tipo;
    this.etiqueta = props.etiqueta;
    this.valor = props.valor;
    this.fecha = props.fecha;
    this.creadoEn = props.creadoEn;
    this.actualizadoEn = props.actualizadoEn;
  }

  toPlainObject(): NotaProps {
    return {
      id: this.id,
      estudianteId: this.estudianteId,
      asignacionId: this.asignacionId,
      periodoId: this.periodoId,
      tipo: this.tipo,
      etiqueta: this.etiqueta,
      valor: this.valor,
      fecha: this.fecha,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
    };
  }
}