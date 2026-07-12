import { randomUUID } from "crypto";

export function generarId(prefijo: string): string {
  return `${prefijo}-${randomUUID().split("-")[0].toUpperCase()}`;
}