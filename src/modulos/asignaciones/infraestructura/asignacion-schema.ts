import mongoose, { Schema } from "mongoose";

export interface IAsignacionDocument {
  _id: string;
  profesorId: string;
  cursoId: string;
  seccionId: string;
  periodoId: string;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

const AsignacionSchema = new Schema<IAsignacionDocument>(
  {
    _id: { type: String, required: true },
    profesorId: { type: String, required: true },
    cursoId: { type: String, required: true },
    seccionId: { type: String, required: true },
    periodoId: { type: String, required: true },
    activo: { type: Boolean, default: true },
    creadoEn: { type: String, required: true },
    actualizadoEn: { type: String, required: true },
  },
  { _id: false }
);

AsignacionSchema.index({ profesorId: 1, cursoId: 1, seccionId: 1, periodoId: 1 }, { unique: true });

export const AsignacionModel =
  mongoose.models.Asignacion ||
  mongoose.model<IAsignacionDocument>("Asignacion", AsignacionSchema, "asignaciones");