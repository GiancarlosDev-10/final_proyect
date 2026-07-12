import mongoose, { Schema } from "mongoose";

export interface ISeccionDocument {
  _id: string;
  nombre: string;
  grado: string;
  anio: number;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

const SeccionSchema = new Schema<ISeccionDocument>(
  {
    _id: { type: String, required: true },
    nombre: { type: String, required: true },
    grado: { type: String, required: true },
    anio: { type: Number, required: true },
    activo: { type: Boolean, default: true },
    creadoEn: { type: String, required: true },
    actualizadoEn: { type: String, required: true },
  },
  { _id: false }
);

export const SeccionModel =
  mongoose.models.Seccion ||
  mongoose.model<ISeccionDocument>("Seccion", SeccionSchema, "secciones");