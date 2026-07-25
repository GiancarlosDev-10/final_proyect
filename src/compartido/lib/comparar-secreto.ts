import { timingSafeEqual } from "node:crypto";

/** Compara dos strings en tiempo constante para evitar timing attacks sobre secretos. */
export function compararSecretoTimingSafe(valor: string | null, esperado: string): boolean {
  if (valor === null) return false;
  const bufferValor = Buffer.from(valor);
  const bufferEsperado = Buffer.from(esperado);
  if (bufferValor.length !== bufferEsperado.length) return false;
  return timingSafeEqual(bufferValor, bufferEsperado);
}
