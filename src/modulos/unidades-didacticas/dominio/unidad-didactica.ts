import { ErrorDominio } from "@/compartido/dominio/errores";
import { EstadoUnidadDidactica, ESTADOS_UNIDAD_DIDACTICA } from "@/config/constantes";

export class UnidadDidacticaNoEncontradaError extends ErrorDominio {
  readonly codigo = "UNIDAD_DIDACTICA_NO_ENCONTRADA";
  constructor(id: string) {
    super(`No se encontró la unidad didáctica con id "${id}".`);
  }
}

export class UnidadDidacticaCerradaError extends ErrorDominio {
  readonly codigo = "UNIDAD_DIDACTICA_CERRADA";
  constructor() {
    super("No se pueden modificar notas en una unidad didáctica cerrada.");
  }
}

export class UnidadDidacticaAbiertaError extends ErrorDominio {
  readonly codigo = "UNIDAD_DIDACTICA_ABIERTA";
  constructor() {
    super("No se puede cerrar el periodo mientras tenga unidades didácticas abiertas.");
  }
}

export interface UnidadDidacticaProps {
  id: string;
  nombre: string;
  cursoId: string;
  periodoId: string;
  orden: number;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoUnidadDidactica;
  creadoEn: string;
  actualizadoEn: string;
}

export class UnidadDidactica {
  readonly id: string;
  readonly nombre: string;
  readonly cursoId: string;
  readonly periodoId: string;
  readonly orden: number;
  readonly fechaInicio: string;
  readonly fechaFin: string;
  readonly estado: EstadoUnidadDidactica;
  readonly creadoEn: string;
  readonly actualizadoEn: string;

  constructor(props: UnidadDidacticaProps) {
    this.id = props.id;
    this.nombre = props.nombre;
    this.cursoId = props.cursoId;
    this.periodoId = props.periodoId;
    this.orden = props.orden;
    this.fechaInicio = props.fechaInicio;
    this.fechaFin = props.fechaFin;
    this.estado = props.estado;
    this.creadoEn = props.creadoEn;
    this.actualizadoEn = props.actualizadoEn;
  }

  estaAbierta(): boolean {
    return this.estado === ESTADOS_UNIDAD_DIDACTICA.ABIERTO;
  }

  toPlainObject(): UnidadDidacticaProps {
    return {
      id: this.id,
      nombre: this.nombre,
      cursoId: this.cursoId,
      periodoId: this.periodoId,
      orden: this.orden,
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin,
      estado: this.estado,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
    };
  }
}
