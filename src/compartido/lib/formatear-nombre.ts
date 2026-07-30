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

function capitalizarPalabra(palabra: string): string {
  return palabra.length === 0 ? palabra : palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
}

/** Igual que apellidoNombre, pero para actas/reportes formales: APELLIDOS en mayúscula, Nombre en Title Case. */
export function apellidoNombreReporte(nombreCompleto: string): string {
  const partes = nombreCompleto.trim().split(/\s+/);
  if (partes.length < 2) return capitalizarPalabra(nombreCompleto);
  const [nombre, ...apellidos] = partes;
  const apellidosMayus = apellidos.join(" ").toUpperCase();
  const nombreCapitalizado = nombre.split(/\s+/).map(capitalizarPalabra).join(" ");
  return `${apellidosMayus}, ${nombreCapitalizado}`;
}
