import mongoose, { Schema } from "mongoose";
import { TipoNota } from "@/config/constantes";

export interface INotaDocument {
  _id: string;
  estudianteId: string;
  asignacionId: string;
  periodoId: string;
  unidadDidacticaId?: string;
  tipo: TipoNota;
  etiqueta: string;
  valor: number;
  fecha: string;
  creadoEn: string;
  actualizadoEn: string;
}

const NotaSchema = new Schema<INotaDocument>(
  {
    _id: { type: String, required: true },
    estudianteId: { type: String, required: true },
    asignacionId: { type: String, required: true },
    periodoId: { type: String, required: true },
    unidadDidacticaId: { type: String },
    tipo: {
      type: String,
      enum: ["PRACTICA", "EXAMEN", "TRABAJO", "PARTICIPACION"],
      required: true,
    },
    etiqueta: { type: String, required: true },
    valor: { type: Number, required: true, min: 0, max: 20 },
    fecha: { type: String, required: true },
    creadoEn: { type: String, required: true },
    actualizadoEn: { type: String, required: true },
  },
  { _id: false }
);

NotaSchema.index({ estudianteId: 1, asignacionId: 1, periodoId: 1 });
NotaSchema.index({ unidadDidacticaId: 1 });

export const NotaModel =
  mongoose.models.Nota ||
  mongoose.model<INotaDocument>("Nota", NotaSchema, "notas");