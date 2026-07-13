import { conectarMongoDB } from "@/compartido/infraestructura/mongodb-client";
import { ITelegramChatRepositorio } from "@/modulos/telegram/aplicacion/i-telegram-chat-repositorio";
import { TelegramChat } from "@/modulos/telegram/dominio/telegram-chat";
import { TelegramChatModel } from "@/modulos/telegram/infraestructura/telegram-chat-schema";

export class TelegramChatRepositorioMongo implements ITelegramChatRepositorio {
  async buscarPorChatId(chatId: string): Promise<TelegramChat | null> {
    await conectarMongoDB();
    const doc = await TelegramChatModel.findById(chatId).lean();
    if (!doc) return null;
    return new TelegramChat({
      chatId: doc._id,
      profesorId: doc.profesorId,
      creadoEn: doc.creadoEn,
      actualizadoEn: doc.actualizadoEn,
    });
  }

  async vincular(chat: TelegramChat): Promise<void> {
    await conectarMongoDB();
    // upsert: si el chat ya estaba vinculado a otro profesor, se reemplaza;
    // creadoEn solo se fija la primera vez que el chat se vincula.
    await TelegramChatModel.findByIdAndUpdate(
      chat.chatId,
      {
        $set: { profesorId: chat.profesorId, actualizadoEn: chat.actualizadoEn },
        $setOnInsert: { creadoEn: chat.creadoEn },
      },
      { upsert: true }
    );
  }

  async desvincular(chatId: string): Promise<void> {
    await conectarMongoDB();
    await TelegramChatModel.findByIdAndDelete(chatId);
  }
}
