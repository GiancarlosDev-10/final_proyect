import mongoose, { Schema } from "mongoose";

export interface ILoginIntentoDocument {
  _id: string; // email normalizado (minúsculas, sin espacios)
  intentosFallidos: number;
  bloqueadoHasta?: string;
  actualizadoEn: string;
}

const LoginIntentoSchema = new Schema<ILoginIntentoDocument>(
  {
    _id: { type: String, required: true },
    intentosFallidos: { type: Number, required: true, default: 0 },
    bloqueadoHasta: { type: String },
    actualizadoEn: { type: String, required: true },
  },
  { _id: false }
);

export const LoginIntentoModel =
  mongoose.models.LoginIntento ||
  mongoose.model<ILoginIntentoDocument>("LoginIntento", LoginIntentoSchema, "login_intentos");
