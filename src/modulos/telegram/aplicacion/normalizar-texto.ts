/** Quita tildes y normaliza mayúsculas para comparar texto libre escrito en el bot ("Nuñez" vs "Nunez"). */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}
