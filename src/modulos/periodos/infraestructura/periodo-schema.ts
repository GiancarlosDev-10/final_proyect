import mongoose, { Schema } from "mongoose";
import { EstadoPeriodo } from "@/config/constantes";

export interface IPeriodoDocument {
  _id: string;
  nombre: string;
  anio: number;
  estado: EstadoPeriodo;
  fechaInicio: string;
  fechaFin: string;
  creadoEn: string;
  actualizadoEn: string;
}

const PeriodoSchema = new Schema<IPeriodoDocument>(
  {
    _id: { type: String, required: true },
    nombre: { type: String, required: true },
    anio: { type: Number, required: true },
    estado: { type: String, enum: ["ABIERTO", "CERRADO"], required: true },
    fechaInicio: { type: String, required: true },
    fechaFin: { type: String, required: true },
    creadoEn: { type: String, required: true },
    actualizadoEn: { type: String, required: true },
  },
  { _id: false }
);

export const PeriodoModel =
  mongoose.models.Periodo ||
  mongoose.model<IPeriodoDocument>("Periodo", PeriodoSchema, "periodos");