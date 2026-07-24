import { DiaSemana, DIAS_SEMANA } from "@/config/constantes";

/**
 * El colegio funciona en hora de Lima, pero en producción (Vercel) las
 * funciones serverless corren en UTC por defecto — usar
 * Date.prototype.getHours()/getDay() ahí da la hora del servidor, no la del
 * colegio (~5 horas de diferencia). Por eso se fija la zona explícitamente
 * con Intl.DateTimeFormat en vez de depender de la zona del proceso.
 */
const ZONA_HORARIA = "America/Lima";

const DIAS_SEMANA_POR_ABREVIATURA: Record<string, DiaSemana | null> = {
  Sun: null,
  Mon: DIAS_SEMANA.LUNES,
  Tue: DIAS_SEMANA.MARTES,
  Wed: DIAS_SEMANA.MIERCOLES,
  Thu: DIAS_SEMANA.JUEVES,
  Fri: DIAS_SEMANA.VIERNES,
  Sat: null,
};

function partesEnLima(fecha: Date): Record<string, string> {
  const formateador = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });
  return Object.fromEntries(formateador.formatToParts(fecha).map((p) => [p.type, p.value]));
}

export function diaSemanaDeHoy(fecha: Date = new Date()): DiaSemana | null {
  const partes = partesEnLima(fecha);
  return DIAS_SEMANA_POR_ABREVIATURA[partes.weekday] ?? null;
}

export function fechaDeHoyISO(fecha: Date = new Date()): string {
  const partes = partesEnLima(fecha);
  return `${partes.year}-${partes.month}-${partes.day}`;
}

export function horaActualHHMM(fecha: Date = new Date()): string {
  const partes = partesEnLima(fecha);
  // Algunos motores ICU devuelven "24" para la medianoche con hour12:false.
  const hora = partes.hour === "24" ? "00" : partes.hour;
  return `${hora}:${partes.minute}`;
}

export function sumarMinutos(hora: string, minutos: number): string {
  const [h, m] = hora.split(":").map(Number);
  const total = h * 60 + m + minutos;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
