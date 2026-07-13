import mongoose, { Schema } from "mongoose";
import { TipoRecordatorio } from "@/config/constantes";

export interface IRecordatorioDocument {
  _id: string;
  profesorId: string;
  fecha: string;
  titulo: string;
  descripcion?: string;
  tipo: TipoRecordatorio;
  creadoEn: string;
  actualizadoEn: string;
}

const RecordatorioSchema = new Schema<IRecordatorioDocument>(
  {
    _id: { type: String, required: true },
    profesorId: { type: String, required: true },
    fecha: { type: String, required: true },
    titulo: { type: String, required: true },
    descripcion: { type: String },
    tipo: {
      type: String,
      enum: ["REUNION_PADRE", "REUNION_PROFESOR", "REUNION_DIRECTOR", "OTRO"],
      required: true,
    },
    creadoEn: { type: String, required: true },
    actualizadoEn: { type: String, required: true },
  },
  { _id: false }
);

RecordatorioSchema.index({ profesorId: 1 });

export const RecordatorioModel =
  mongoose.models.Recordatorio ||
  mongoose.model<IRecordatorioDocument>("Recordatorio", RecordatorioSchema, "recordatorios");
