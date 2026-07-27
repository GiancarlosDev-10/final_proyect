import { conectarMongoDB } from "@/compartido/infraestructura/mongodb-client";
import { IApoderadoVinculadoRepositorio } from "@/modulos/telegram/aplicacion/i-apoderado-vinculado-repositorio";
import { ApoderadoVinculado } from "@/modulos/telegram/dominio/apoderado-vinculado";
import { ApoderadoVinculadoModel } from "@/modulos/telegram/infraestructura/apoderado-vinculado-schema";

export class ApoderadoVinculadoRepositorioMongo implements IApoderadoVinculadoRepositorio {
  async buscarPorChatIdYEstudianteId(chatId: string, estudianteId: string): Promise<ApoderadoVinculado | null> {
    await conectarMongoDB();
    const doc = await ApoderadoVinculadoModel.findOne({ chatId, estudianteId }).lean();
    if (!doc) return null;
    return new ApoderadoVinculado({ id: doc._id, chatId: doc.chatId, estudianteId: doc.estudianteId, creadoEn: doc.creadoEn });
  }

  async listarPorEstudianteId(estudianteId: string): Promise<ApoderadoVinculado[]> {
    await conectarMongoDB();
    const docs = await ApoderadoVinculadoModel.find({ estudianteId }).lean();
    return docs.map(
      (doc) => new ApoderadoVinculado({ id: doc._id, chatId: doc.chatId, estudianteId: doc.estudianteId, creadoEn: doc.creadoEn })
    );
  }

  async vincular(vinculo: ApoderadoVinculado): Promise<void> {
    await conectarMongoDB();
    await ApoderadoVinculadoModel.findOneAndUpdate(
      { chatId: vinculo.chatId, estudianteId: vinculo.estudianteId },
      { $setOnInsert: { _id: vinculo.id, creadoEn: vinculo.creadoEn } },
      { upsert: true }
    );
  }
}
