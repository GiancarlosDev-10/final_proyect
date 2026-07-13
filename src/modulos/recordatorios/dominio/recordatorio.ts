import { ErrorDominio } from "@/compartido/dominio/errores";
import { TipoRecordatorio } from "@/config/constantes";

export class RecordatorioNoEncontradoError extends ErrorDominio {
  readonly codigo = "RECORDATORIO_NO_ENCONTRADO";
  constructor(id: string) {
    super(`No se encontró el recordatorio con id "${id}".`);
  }
}

export interface RecordatorioProps {
  id: string;
  profesorId: string;
  fecha: string;
  titulo: string;
  descripcion?: string;
  tipo: TipoRecordatorio;
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
  readonly creadoEn: string;
  readonly actualizadoEn: string;

  constructor(props: RecordatorioProps) {
    this.id = props.id;
    this.profesorId = props.profesorId;
    this.fecha = props.fecha;
    this.titulo = props.titulo;
    this.descripcion = props.descripcion;
    this.tipo = props.tipo;
    this.creadoEn = props.creadoEn;
    this.actualizadoEn = props.actualizadoEn;
  }

  toPlainObject(): RecordatorioProps {
    return {
      id: this.id,
      profesorId: this.profesorId,
      fecha: this.fecha,
      titulo: this.titulo,
      descripcion: this.descripcion,
      tipo: this.tipo,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
    };
  }
}
