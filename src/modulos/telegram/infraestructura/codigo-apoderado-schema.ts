import mongoose, { Schema } from "mongoose";

export interface ICodigoApoderadoDocument {
  _id: string; // chatId de Telegram (un solo código pendiente por chat)
  estudianteId: string;
  codigo: string;
  expiresAt: string;
  creadoEn: string;
}

const CodigoApoderadoSchema = new Schema<ICodigoApoderadoDocument>(
  {
    _id: { type: String, required: true },
    estudianteId: { type: String, required: true },
    codigo: { type: String, required: true },
    expiresAt: { type: String, required: true },
    creadoEn: { type: String, required: true },
  },
  { _id: false }
);

export const CodigoApoderadoModel =
  mongoose.models.CodigoApoderado ||
  mongoose.model<ICodigoApoderadoDocument>("CodigoApoderado", CodigoApoderadoSchema, "telegram_codigos_apoderado");
