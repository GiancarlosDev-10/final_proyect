import mongoose, { Schema } from "mongoose";

export interface ITelegramChatDocument {
  _id: string; // chatId de Telegram
  profesorId: string;
  creadoEn: string;
  actualizadoEn: string;
}

const TelegramChatSchema = new Schema<ITelegramChatDocument>(
  {
    _id: { type: String, required: true },
    profesorId: { type: String, required: true },
    creadoEn: { type: String, required: true },
    actualizadoEn: { type: String, required: true },
  },
  { _id: false }
);

TelegramChatSchema.index({ profesorId: 1 });

export const TelegramChatModel =
  mongoose.models.TelegramChat ||
  mongoose.model<ITelegramChatDocument>("TelegramChat", TelegramChatSchema, "telegram_chats");
