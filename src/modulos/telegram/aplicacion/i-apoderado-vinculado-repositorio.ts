import { ApoderadoVinculado } from "@/modulos/telegram/dominio/apoderado-vinculado";

export interface IApoderadoVinculadoRepositorio {
  buscarPorChatIdYEstudianteId(chatId: string, estudianteId: string): Promise<ApoderadoVinculado | null>;
  listarPorEstudianteId(estudianteId: string): Promise<ApoderadoVinculado[]>;
  vincular(vinculo: ApoderadoVinculado): Promise<void>;
  eliminarPorEstudiante(estudianteId: string): Promise<void>;
}
