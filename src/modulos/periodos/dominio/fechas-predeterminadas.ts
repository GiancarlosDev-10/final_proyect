export interface PlantillaPeriodo {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
}

/**
 * Calendario típico de la EBR peruana: 4 bimestres de marzo a diciembre, con
 * las vacaciones de medio año (última semana de julio a primera de agosto)
 * como el hueco entre el Bimestre 2 y el Bimestre 3, no como parte de ningún
 * periodo. Son fechas orientativas y quedan editables una vez generadas.
 */
export function calcularFechasPeriodosPredeterminadas(anio: number): PlantillaPeriodo[] {
  return [
    { nombre: "Periodo 1", fechaInicio: `${anio}-03-02`, fechaFin: `${anio}-05-08` },
    { nombre: "Periodo 2", fechaInicio: `${anio}-05-11`, fechaFin: `${anio}-07-26` },
    { nombre: "Periodo 3", fechaInicio: `${anio}-08-10`, fechaFin: `${anio}-10-16` },
    { nombre: "Periodo 4", fechaInicio: `${anio}-10-19`, fechaFin: `${anio}-12-18` },
  ];
}
