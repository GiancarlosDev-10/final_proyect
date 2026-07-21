import { SeccionProps } from "@/modulos/secciones/dominio/seccion";
import { ORDEN_NIVELES_EDUCATIVOS } from "@/config/constantes";

function numeroDeGrado(grado: string): number {
  const match = grado.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

/** Orden de exhibición: nivel (Inicial→Primaria→Secundaria), luego grado numérico, luego nombre de sección (A/B). */
export function compararSecciones(a: SeccionProps, b: SeccionProps): number {
  const nivelDiff = ORDEN_NIVELES_EDUCATIVOS.indexOf(a.nivel) - ORDEN_NIVELES_EDUCATIVOS.indexOf(b.nivel);
  if (nivelDiff !== 0) return nivelDiff;
  const gradoDiff = numeroDeGrado(a.grado) - numeroDeGrado(b.grado);
  if (gradoDiff !== 0) return gradoDiff;
  return a.nombre.localeCompare(b.nombre);
}
