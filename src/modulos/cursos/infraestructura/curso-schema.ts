import mongoose, { Schema } from "mongoose";

export interface ICursoDocument {
  _id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

const CursoSchema = new Schema<ICursoDocument>(
  {
    _id: { type: String, required: true },
    nombre: { type: String, required: true },
    descripcion: { type: String },
    activo: { type: Boolean, default: true },
    creadoEn: { type: String, required: true },
    actualizadoEn: { type: String, required: true },
  },
  { _id: false }
);

export const CursoModel =
  mongoose.models.Curso ||
  mongoose.model<ICursoDocument>("Curso", CursoSchema, "cursos");