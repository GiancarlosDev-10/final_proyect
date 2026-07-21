import mongoose, { Schema } from "mongoose";
import { EstadoAsistencia } from "@/config/constantes";

export interface IRegistroAsistenciaDocument {
  _id: string;
  sesionId: string;
  estudianteId: string;
  estado: EstadoAsistencia;
  bloqueado: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

const RegistroAsistenciaSchema = new Schema<IRegistroAsistenciaDocument>(
  {
    _id: { type: String, required: true },
    sesionId: { type: String, required: true },
    estudianteId: { type: String, required: true },
    estado: { type: String, enum: ["PRESENTE", "TARDANZA", "AUSENTE", "JUSTIFICADO"], required: true },
    bloqueado: { type: Boolean, default: false },
    creadoEn: { type: String, required: true },
    actualizadoEn: { type: String, required: true },
  },
  { _id: false }
);

RegistroAsistenciaSchema.index({ sesionId: 1, estudianteId: 1 }, { unique: true });

export const RegistroAsistenciaModel =
  mongoose.models.RegistroAsistencia ||
  mongoose.model<IRegistroAsistenciaDocument>("RegistroAsistencia", RegistroAsistenciaSchema, "registros_asistencia");
