import { conectarMongoDB } from "@/compartido/infraestructura/mongodb-client";
import { IApoderadoIntentoRepositorio } from "@/modulos/telegram/aplicacion/i-apoderado-intento-repositorio";
import { ApoderadoIntento } from "@/modulos/telegram/dominio/apoderado-intento";
import { ApoderadoIntentoModel } from "@/modulos/telegram/infraestructura/apoderado-intento-schema";

export class ApoderadoIntentoRepositorioMongo implements IApoderadoIntentoRepositorio {
  async buscarPorChatId(chatId: string): Promise<ApoderadoIntento | null> {
    await conectarMongoDB();
    const doc = await ApoderadoIntentoModel.findById(chatId).lean();
    if (!doc) return null;
    return new ApoderadoIntento({
      chatId: doc._id,
      intentosFallidos: doc.intentosFallidos,
      bloqueadoHasta: doc.bloqueadoHasta,
      actualizadoEn: doc.actualizadoEn,
    });
  }

  async guardar(intento: ApoderadoIntento): Promise<void> {
    await conectarMongoDB();
    const camposDefinidos: Record<string, string | number> = {
      intentosFallidos: intento.intentosFallidos,
      actualizadoEn: intento.actualizadoEn,
    };
    if (intento.bloqueadoHasta !== undefined) camposDefinidos.bloqueadoHasta = intento.bloqueadoHasta;

    await ApoderadoIntentoModel.findByIdAndUpdate(
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
    await ApoderadoIntentoModel.findByIdAndDelete(chatId);
  }
}
