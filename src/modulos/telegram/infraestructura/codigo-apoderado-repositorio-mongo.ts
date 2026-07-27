import { conectarMongoDB } from "@/compartido/infraestructura/mongodb-client";
import { ICodigoApoderadoRepositorio } from "@/modulos/telegram/aplicacion/i-codigo-apoderado-repositorio";
import { CodigoApoderado } from "@/modulos/telegram/dominio/codigo-apoderado";
import { CodigoApoderadoModel } from "@/modulos/telegram/infraestructura/codigo-apoderado-schema";

export class CodigoApoderadoRepositorioMongo implements ICodigoApoderadoRepositorio {
  async buscarPorChatId(chatId: string): Promise<CodigoApoderado | null> {
    await conectarMongoDB();
    const doc = await CodigoApoderadoModel.findById(chatId).lean();
    if (!doc) return null;
    return new CodigoApoderado({
      chatId: doc._id,
      estudianteId: doc.estudianteId,
      codigo: doc.codigo,
      expiresAt: doc.expiresAt,
      creadoEn: doc.creadoEn,
    });
  }

  async guardar(codigo: CodigoApoderado): Promise<void> {
    await conectarMongoDB();
    await CodigoApoderadoModel.findByIdAndUpdate(
      codigo.chatId,
      {
        $set: {
          estudianteId: codigo.estudianteId,
          codigo: codigo.codigo,
          expiresAt: codigo.expiresAt,
          creadoEn: codigo.creadoEn,
        },
      },
      { upsert: true }
    );
  }

  async eliminar(chatId: string): Promise<void> {
    await conectarMongoDB();
    await CodigoApoderadoModel.findByIdAndDelete(chatId);
  }
}
