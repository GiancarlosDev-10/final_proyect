import { TelegramIntento } from "@/modulos/telegram/dominio/telegram-intento";

export interface ITelegramIntentoRepositorio {
  buscarPorChatId(chatId: string): Promise<TelegramIntento | null>;
  guardar(intento: TelegramIntento): Promise<void>;
  eliminar(chatId: string): Promise<void>;
}
