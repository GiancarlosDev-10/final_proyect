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