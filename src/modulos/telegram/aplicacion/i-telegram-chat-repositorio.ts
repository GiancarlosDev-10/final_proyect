import { TelegramChat } from "@/modulos/telegram/dominio/telegram-chat";

export interface ITelegramChatRepositorio {
  buscarPorChatId(chatId: string): Promise<TelegramChat | null>;
  vincular(chat: TelegramChat): Promise<void>;
  desvincular(chatId: string): Promise<void>;
}
