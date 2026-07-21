import mongoose, { Schema } from "mongoose";

export interface ISesionAsistenciaDocument {
  _id: string;
  bloqueHorarioId: string;
  fecha: string;
  horaEntrada: string;
  horaLimiteTardanza: string;
  horaCierre: string;
  creadoEn: string;
  actualizadoEn: string;
}

const SesionAsistenciaSchema = new Schema<ISesionAsistenciaDocument>(
  {
    _id: { type: String, required: true },
    bloqueHorarioId: { type: String, required: true },
    fecha: { type: String, required: true },
    horaEntrada: { type: String, required: true },
    horaLimiteTardanza: { type: String, required: true },
    horaCierre: { type: String, required: true },
    creadoEn: { type: String, required: true },
    actualizadoEn: { type: String, required: true },
  },
  { _id: false }
);

SesionAsistenciaSchema.index({ bloqueHorarioId: 1, fecha: 1 }, { unique: true });

export const SesionAsistenciaModel =
  mongoose.models.SesionAsistencia ||
  mongoose.model<ISesionAsistenciaDocument>("SesionAsistencia", SesionAsistenciaSchema, "sesiones_asistencia");
