/**
 * Formatea una fecha para mostrarla en pantalla, en el formato peruano
 * DD-MM-AA (día, mes, año de 2 dígitos).
 *
 * Acepta tanto fechas puras "YYYY-MM-DD" (Periodos, Unidades Didácticas,
 * Notas, fecha de nacimiento, Recordatorios) como timestamps ISO completos
 * (ej. "creadoEn"). Las fechas puras se parsean forzando medianoche UTC
 * — igual que calcularFechasUnidadesDidacticas — para que "2026-03-02" no
 * se corra un día al mostrarla en un huso horario detrás de UTC (Perú es
 * UTC-5): sin este cuidado, `new Date("2026-03-02")` se interpreta como
 * medianoche UTC, que en Perú ya es 1° de marzo por la tarde.
 */
export function formatearFecha(fechaISO: string): string {
  const fecha = fechaISO.length <= 10 ? new Date(`${fechaISO}T00:00:00.000Z`) : new Date(fechaISO);
  if (Number.isNaN(fecha.getTime())) return fechaISO;
  const dd = String(fecha.getUTCDate()).padStart(2, "0");
  const mm = String(fecha.getUTCMonth() + 1).padStart(2, "0");
  const aa = String(fecha.getUTCFullYear()).slice(-2);
  return `${dd}-${mm}-${aa}`;
}
