import { z } from "zod";

export const PIN_TELEGRAM_LENGTH = 6;

export const pinTelegramSchema = z
  .string()
  .regex(new RegExp(`^\\d{${PIN_TELEGRAM_LENGTH}}$`), `El PIN debe tener exactamente ${PIN_TELEGRAM_LENGTH} dígitos numéricos.`);

export function validarPinTelegram(pin: string): string[] {
  const resultado = pinTelegramSchema.safeParse(pin);
  if (resultado.success) return [];
  return resultado.error.issues.map((issue) => issue.message);
}
