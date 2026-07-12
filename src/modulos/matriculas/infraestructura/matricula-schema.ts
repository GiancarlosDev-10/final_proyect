import mongoose, { Schema } from "mongoose";

export interface IMatriculaDocument {
  _id: string;
  estudianteId: string;
  seccionId: string;
  anio: number;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

const MatriculaSchema = new Schema<IMatriculaDocument>(
  {
    _id: { type: String, required: true },
    estudianteId: { type: String, required: true },
    seccionId: { type: String, required: true },
    anio: { type: Number, required: true },
    activo: { type: Boolean, default: true },
    creadoEn: { type: String, required: true },
    actualizadoEn: { type: String, required: true },
  },
  { _id: false }
);

MatriculaSchema.index({ estudianteId: 1, anio: 1 }, { unique: true });

export const MatriculaModel =
  mongoose.models.Matricula ||
  mongoose.model<IMatriculaDocument>("Matricula", MatriculaSchema, "matriculas");