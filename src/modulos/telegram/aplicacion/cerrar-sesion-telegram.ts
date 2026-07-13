import { ITelegramChatRepositorio } from "@/modulos/telegram/aplicacion/i-telegram-chat-repositorio";

export async function cerrarSesionTelegram(chatId: string, chatRepo: ITelegramChatRepositorio): Promise<void> {
  await chatRepo.desvincular(chatId);
}
