import { CodigoApoderado } from "@/modulos/telegram/dominio/codigo-apoderado";

export interface ICodigoApoderadoRepositorio {
  buscarPorChatId(chatId: string): Promise<CodigoApoderado | null>;
  guardar(codigo: CodigoApoderado): Promise<void>;
  eliminar(chatId: string): Promise<void>;
}
