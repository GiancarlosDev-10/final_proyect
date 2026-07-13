import { TipoRecordatorio } from "@/config/constantes";

export const ETIQUETAS_TIPO_RECORDATORIO: Record<TipoRecordatorio, string> = {
  REUNION_PADRE: "Reunión con padre",
  REUNION_PROFESOR: "Reunión con profesor",
  REUNION_DIRECTOR: "Reunión con director",
  OTRO: "Otro",
};

export const COLORES_TIPO_RECORDATORIO: Record<TipoRecordatorio, string> = {
  REUNION_PADRE: "bg-amber-100 border-amber-300 dark:bg-amber-950/40 dark:border-amber-800",
  REUNION_PROFESOR: "bg-sky-100 border-sky-300 dark:bg-sky-950/40 dark:border-sky-800",
  REUNION_DIRECTOR: "bg-rose-100 border-rose-300 dark:bg-rose-950/40 dark:border-rose-800",
  OTRO: "bg-slate-100 border-slate-300 dark:bg-slate-800/40 dark:border-slate-700",
};
