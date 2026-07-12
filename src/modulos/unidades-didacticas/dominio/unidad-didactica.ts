import { ErrorDominio } from "@/compartido/dominio/errores";
import { EstadoUnidadDidactica, ESTADOS_UNIDAD_DIDACTICA } from "@/config/constantes";

export class UnidadDidacticaNoEncontradaError extends ErrorDominio {
  readonly codigo = "UNIDAD_DIDACTICA_NO_ENCONTRADA";
  constructor(id: string) {
    super(`No se encontró la unidad didáctica con id "${id}".`);
  }
}

export interface UnidadDidacticaProps {
  id: string;
  nombre: string;
  periodoId: string;
  estado: EstadoUnidadDidactica;
  creadoEn: string;
  actualizadoEn: string;
}

export class UnidadDidactica {
  readonly id: string;
  readonly nombre: string;
  readonly periodoId: string;
  readonly estado: EstadoUnidadDidactica;
  readonly creadoEn: string;
  readonly actualizadoEn: string;

  constructor(props: UnidadDidacticaProps) {
    this.id = props.id;
    this.nombre = props.nombre;
    this.periodoId = props.periodoId;
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
      periodoId: this.periodoId,
      estado: this.estado,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
    };
  }
}
