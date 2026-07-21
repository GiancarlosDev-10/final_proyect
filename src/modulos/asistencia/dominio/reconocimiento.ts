import { ErrorDominio } from "@/compartido/dominio/errores";

export class MatriculaActivaNoEncontradaError extends ErrorDominio {
  readonly codigo = "MATRICULA_ACTIVA_NO_ENCONTRADA";
  constructor(estudianteId: string) {
    super(`El estudiante "${estudianteId}" no tiene una matrícula activa este año.`);
  }
}

export class SinClaseEnCursoError extends ErrorDominio {
  readonly codigo = "SIN_CLASE_EN_CURSO";
  constructor(estudianteId: string) {
    super(`El estudiante "${estudianteId}" no tiene ninguna clase en curso en este momento.`);
  }
}
