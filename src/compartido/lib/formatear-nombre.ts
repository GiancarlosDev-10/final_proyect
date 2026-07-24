/**
 * El seed siempre genera nombreCompleto como "Nombre Apellido1 Apellido2"
 * (1 nombre + 2 apellidos, sin nombres compuestos), así que la primera
 * palabra es el nombre y el resto son apellidos.
 */
export function apellidoNombre(nombreCompleto: string): string {
  const partes = nombreCompleto.trim().split(/\s+/);
  if (partes.length < 2) return nombreCompleto;
  const [nombre, ...apellidos] = partes;
  return `${apellidos.join(" ")}, ${nombre}`;
}
