import mongoose, { Schema } from "mongoose";

export interface IAreaDocument {
  _id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

const AreaSchema = new Schema<IAreaDocument>(
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

export const AreaModel =
  mongoose.models.Area ||
  mongoose.model<IAreaDocument>("Area", AreaSchema, "areas");
