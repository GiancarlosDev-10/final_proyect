import mongoose, { Schema } from "mongoose";

export interface IApoderadoIntentoDocument {
  _id: string; // chatId de Telegram
  intentosFallidos: number;
  bloqueadoHasta?: string;
  actualizadoEn: string;
}

const ApoderadoIntentoSchema = new Schema<IApoderadoIntentoDocument>(
  {
    _id: { type: String, required: true },
    intentosFallidos: { type: Number, required: true, default: 0 },
    bloqueadoHasta: { type: String },
    actualizadoEn: { type: String, required: true },
  },
  { _id: false }
);

export const ApoderadoIntentoModel =
  mongoose.models.ApoderadoIntento ||
  mongoose.model<IApoderadoIntentoDocument>("ApoderadoIntento", ApoderadoIntentoSchema, "telegram_intentos_apoderado");
