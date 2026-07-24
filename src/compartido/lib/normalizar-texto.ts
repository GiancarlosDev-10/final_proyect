/** Quita tildes y normaliza mayúsculas para comparar texto libre ("Pérez" vs "Perez"). */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}
