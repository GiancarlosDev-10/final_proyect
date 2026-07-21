export const ROLES = {
  ADMIN: "ADMIN",
  PROFESOR: "PROFESOR",
} as const;

export type Rol = (typeof ROLES)[keyof typeof ROLES];

export const ESTADOS_PERIODO = {
  ABIERTO: "ABIERTO",
  CERRADO: "CERRADO",
} as const;

export type EstadoPeriodo = (typeof ESTADOS_PERIODO)[keyof typeof ESTADOS_PERIODO];

export const ESTADOS_UNIDAD_DIDACTICA = {
  ABIERTO: "ABIERTO",
  CERRADO: "CERRADO",
} as const;

export type EstadoUnidadDidactica = (typeof ESTADOS_UNIDAD_DIDACTICA)[keyof typeof ESTADOS_UNIDAD_DIDACTICA];

export const TIPOS_NOTA = {
  PRACTICA: "PRACTICA",
  EXAMEN: "EXAMEN",
  TRABAJO: "TRABAJO",
  PARTICIPACION: "PARTICIPACION",
} as const;

export type TipoNota = (typeof TIPOS_NOTA)[keyof typeof TIPOS_NOTA];

export const TIPOS_RECORDATORIO = {
  REUNION_PADRE: "REUNION_PADRE",
  REUNION_PROFESOR: "REUNION_PROFESOR",
  REUNION_DIRECTOR: "REUNION_DIRECTOR",
  OTRO: "OTRO",
} as const;

export type TipoRecordatorio = (typeof TIPOS_RECORDATORIO)[keyof typeof TIPOS_RECORDATORIO];

export const DIAS_SEMANA = {
  LUNES: "LUNES",
  MARTES: "MARTES",
  MIERCOLES: "MIERCOLES",
  JUEVES: "JUEVES",
  VIERNES: "VIERNES",
} as const;

export type DiaSemana = (typeof DIAS_SEMANA)[keyof typeof DIAS_SEMANA];

export const ORDEN_DIAS_SEMANA: DiaSemana[] = [
  DIAS_SEMANA.LUNES,
  DIAS_SEMANA.MARTES,
  DIAS_SEMANA.MIERCOLES,
  DIAS_SEMANA.JUEVES,
  DIAS_SEMANA.VIERNES,
];

export const NIVELES_EDUCATIVOS = {
  INICIAL: "INICIAL",
  PRIMARIA: "PRIMARIA",
  SECUNDARIA: "SECUNDARIA",
} as const;

export type NivelEducativo = (typeof NIVELES_EDUCATIVOS)[keyof typeof NIVELES_EDUCATIVOS];

export const ORDEN_NIVELES_EDUCATIVOS: NivelEducativo[] = [
  NIVELES_EDUCATIVOS.INICIAL,
  NIVELES_EDUCATIVOS.PRIMARIA,
  NIVELES_EDUCATIVOS.SECUNDARIA,
];

export const ETIQUETAS_NIVEL_EDUCATIVO: Record<NivelEducativo, string> = {
  INICIAL: "Inicial",
  PRIMARIA: "Primaria",
  SECUNDARIA: "Secundaria",
};

export const ESTADOS_ASISTENCIA = {
  PRESENTE: "PRESENTE",
  TARDANZA: "TARDANZA",
  AUSENTE: "AUSENTE",
  JUSTIFICADO: "JUSTIFICADO",
} as const;

export type EstadoAsistencia = (typeof ESTADOS_ASISTENCIA)[keyof typeof ESTADOS_ASISTENCIA];

export interface PeriodoHorario {
  horaInicio: string;
  horaFin: string;
}

export const PERIODOS_HORARIO: PeriodoHorario[] = [
  { horaInicio: "08:00", horaFin: "08:45" },
  { horaInicio: "08:45", horaFin: "09:30" },
  { horaInicio: "09:30", horaFin: "10:15" },
  { horaInicio: "10:30", horaFin: "11:15" },
  { horaInicio: "11:15", horaFin: "12:00" },
  { horaInicio: "12:00", horaFin: "12:45" },
  { horaInicio: "13:30", horaFin: "14:15" },
];