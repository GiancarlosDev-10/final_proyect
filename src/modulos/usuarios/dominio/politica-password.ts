import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 8;

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`)
  .max(72, "No puede superar los 72 caracteres.")
  .regex(/[a-z]/, "Debe incluir al menos una letra minúscula.")
  .regex(/[A-Z]/, "Debe incluir al menos una letra mayúscula.")
  .regex(/[0-9]/, "Debe incluir al menos un número.")
  .regex(/[^A-Za-z0-9]/, "Debe incluir al menos un carácter especial (ej. !@#$%).");

export function validarPassword(password: string): string[] {
  const resultado = passwordSchema.safeParse(password);
  if (resultado.success) return [];
  return resultado.error.issues.map((issue) => issue.message);
}
