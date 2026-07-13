import mongoose, { Schema } from "mongoose";

export interface ITelegramIntentoDocument {
  _id: string; // chatId de Telegram
  intentosFallidos: number;
  bloqueadoHasta?: string;
  actualizadoEn: string;
}

const TelegramIntentoSchema = new Schema<ITelegramIntentoDocument>(
  {
    _id: { type: String, required: true },
    intentosFallidos: { type: Number, required: true, default: 0 },
    bloqueadoHasta: { type: String },
    actualizadoEn: { type: String, required: true },
  },
  { _id: false }
);

export const TelegramIntentoModel =
  mongoose.models.TelegramIntento ||
  mongoose.model<ITelegramIntentoDocument>("TelegramIntento", TelegramIntentoSchema, "telegram_intentos");
