/**
 * Antes cada archivo comparaba el email tal cual llegaba (sin normalizar),
 * así que "admin@x.com" y "Admin@X.com" se trataban como cuentas distintas
 * — permitía duplicados por mayúsculas/minúsculas y hacía que el login
 * fallara si el usuario tipeaba el email con una capitalización distinta a
 * como quedó guardado.
 */
export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}
