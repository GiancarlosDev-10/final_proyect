export interface RangoFechas {
  fechaInicio: string;
  fechaFin: string;
}

function formatearFecha(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

function parsearFecha(fecha: string): Date {
  return new Date(`${fecha.slice(0, 10)}T00:00:00.000Z`);
}

/**
 * Un bimestre siempre son 2 meses: la Unidad 1 es el primer mes desde la
 * fecha de inicio del periodo (no del calendario), y la Unidad 2 es el resto
 * hasta la fecha de fin del periodo. Así el corte no depende de en qué día
 * del mes arranca el periodo (ej. periodo del 15/marzo al 15/mayo -> Unidad 1
 * es 15/marzo-14/abril, Unidad 2 es 15/abril-15/mayo).
 */
export function calcularFechasUnidadesDidacticas(
  periodoFechaInicio: string,
  periodoFechaFin: string
): [RangoFechas, RangoFechas] {
  const inicio = parsearFecha(periodoFechaInicio);
  const fin = parsearFecha(periodoFechaFin);

  const puntoMedio = new Date(inicio);
  puntoMedio.setUTCMonth(puntoMedio.getUTCMonth() + 1);

  const finUnidad1 = new Date(puntoMedio);
  finUnidad1.setUTCDate(finUnidad1.getUTCDate() - 1);

  return [
    { fechaInicio: formatearFecha(inicio), fechaFin: formatearFecha(finUnidad1) },
    { fechaInicio: formatearFecha(puntoMedio), fechaFin: formatearFecha(fin) },
  ];
}
