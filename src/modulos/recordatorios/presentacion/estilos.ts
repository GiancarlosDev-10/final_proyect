import { TipoRecordatorio } from "@/config/constantes";

export const ETIQUETAS_TIPO_RECORDATORIO: Record<TipoRecordatorio, string> = {
  REUNION: "Reunión",
  EVALUACION: "Evaluación",
  ENTREGA: "Entrega / Plazo",
  TAREA: "Tarea pendiente",
  OTRO: "Otro",
};

export const COLORES_TIPO_RECORDATORIO: Record<TipoRecordatorio, string> = {
  REUNION: "bg-sky-100 border-sky-300 dark:bg-sky-950/40 dark:border-sky-800",
  EVALUACION: "bg-rose-100 border-rose-300 dark:bg-rose-950/40 dark:border-rose-800",
  ENTREGA: "bg-violet-100 border-violet-300 dark:bg-violet-950/40 dark:border-violet-800",
  TAREA: "bg-teal-100 border-teal-300 dark:bg-teal-950/40 dark:border-teal-800",
  OTRO: "bg-slate-100 border-slate-300 dark:bg-slate-800/40 dark:border-slate-700",
};
