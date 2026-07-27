import { ApoderadoIntento } from "@/modulos/telegram/dominio/apoderado-intento";

export interface IApoderadoIntentoRepositorio {
  buscarPorChatId(chatId: string): Promise<ApoderadoIntento | null>;
  guardar(intento: ApoderadoIntento): Promise<void>;
  eliminar(chatId: string): Promise<void>;
}
