import { TipoNota, TIPOS_NOTA } from "@/config/constantes";

/** Estructural, no `Nota` — así también acepta `NotaProps` tal cual llega del cliente. */
interface NotaConTipoYValor {
  tipo: TipoNota;
  valor: number;
}

/**
 * Pesos de cada tipo de evaluación sobre el promedio de un curso. Si al
 * alumno le faltan notas de algún tipo en la unidad, los pesos de los tipos
 * presentes se re-normalizan entre sí (no se penaliza como si el tipo
 * faltante valiera 0).
 */
export const PESOS_TIPO_NOTA: Record<TipoNota, number> = {
  EXAMEN: 0.4,
  TRABAJO: 0.3,
  PRACTICA: 0.2,
  PARTICIPACION: 0.1,
};

/** Promedio simple de las notas de cada tipo — null si el alumno no tiene ninguna de ese tipo. */
export function promediosPorTipo(notas: NotaConTipoYValor[]): Record<TipoNota, number | null> {
  const resultado = {} as Record<TipoNota, number | null>;
  for (const tipo of Object.values(TIPOS_NOTA)) resultado[tipo] = null;

  const valoresPorTipo = new Map<TipoNota, number[]>();
  for (const nota of notas) {
    valoresPorTipo.set(nota.tipo, [...(valoresPorTipo.get(nota.tipo) ?? []), nota.valor]);
  }
  for (const [tipo, valores] of valoresPorTipo) {
    resultado[tipo] = valores.reduce((s, v) => s + v, 0) / valores.length;
  }
  return resultado;
}

/**
 * Promedio ponderado a partir de los promedios por tipo, redondeado al
 * entero más cercano (0.5 a favor del alumno, ej. 15.5 → 16).
 */
export function promedioPonderadoDesdeTipos(porTipo: Record<TipoNota, number | null>): number | null {
  let sumaPonderada = 0;
  let sumaPesos = 0;
  for (const tipo of Object.values(TIPOS_NOTA)) {
    const valor = porTipo[tipo];
    if (valor === null) continue;
    sumaPonderada += valor * PESOS_TIPO_NOTA[tipo];
    sumaPesos += PESOS_TIPO_NOTA[tipo];
  }
  return sumaPesos > 0 ? Math.round(sumaPonderada / sumaPesos) : null;
}

export function promedioPonderado(notas: NotaConTipoYValor[]): number | null {
  if (notas.length === 0) return null;
  return promedioPonderadoDesdeTipos(promediosPorTipo(notas));
}
