import { DiaSemana, DIAS_SEMANA } from "@/config/constantes";

const DIAS_JS: Array<DiaSemana | null> = [
  null, // domingo
  DIAS_SEMANA.LUNES,
  DIAS_SEMANA.MARTES,
  DIAS_SEMANA.MIERCOLES,
  DIAS_SEMANA.JUEVES,
  DIAS_SEMANA.VIERNES,
  null, // sábado
];

/** Hora local del servidor — suficiente mientras el despliegue no cruce zonas horarias. */
export function diaSemanaDeHoy(fecha: Date = new Date()): DiaSemana | null {
  return DIAS_JS[fecha.getDay()];
}

export function fechaDeHoyISO(fecha: Date = new Date()): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

export function horaActualHHMM(fecha: Date = new Date()): string {
  return `${String(fecha.getHours()).padStart(2, "0")}:${String(fecha.getMinutes()).padStart(2, "0")}`;
}

export function sumarMinutos(hora: string, minutos: number): string {
  const [h, m] = hora.split(":").map(Number);
  const total = h * 60 + m + minutos;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
