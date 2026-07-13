import { conectarMongoDB } from "@/compartido/infraestructura/mongodb-client";
import { ITelegramIntentoRepositorio } from "@/modulos/telegram/aplicacion/i-telegram-intento-repositorio";
import { TelegramIntento } from "@/modulos/telegram/dominio/telegram-intento";
import { TelegramIntentoModel } from "@/modulos/telegram/infraestructura/telegram-intento-schema";

export class TelegramIntentoRepositorioMongo implements ITelegramIntentoRepositorio {
  async buscarPorChatId(chatId: string): Promise<TelegramIntento | null> {
    await conectarMongoDB();
    const doc = await TelegramIntentoModel.findById(chatId).lean();
    if (!doc) return null;
    return new TelegramIntento({
      chatId: doc._id,
      intentosFallidos: doc.intentosFallidos,
      bloqueadoHasta: doc.bloqueadoHasta,
      actualizadoEn: doc.actualizadoEn,
    });
  }

  async guardar(intento: TelegramIntento): Promise<void> {
    await conectarMongoDB();
    const camposDefinidos: Record<string, string | number> = {
      intentosFallidos: intento.intentosFallidos,
      actualizadoEn: intento.actualizadoEn,
    };
    if (intento.bloqueadoHasta !== undefined) camposDefinidos.bloqueadoHasta = intento.bloqueadoHasta;

    await TelegramIntentoModel.findByIdAndUpdate(
      intento.chatId,
      {
        $set: camposDefinidos,
        ...(intento.bloqueadoHasta === undefined ? { $unset: { bloqueadoHasta: "" } } : {}),
      },
      { upsert: true }
    );
  }

  async eliminar(chatId: string): Promise<void> {
    await conectarMongoDB();
    await TelegramIntentoModel.findByIdAndDelete(chatId);
  }
}
