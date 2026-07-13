import { ErrorDominio } from "@/compartido/dominio/errores";

export class AlumnoNoEncontradoError extends ErrorDominio {
  readonly codigo = "ALUMNO_NO_ENCONTRADO";
  constructor() {
    super("No se encontró ese alumno.");
  }
}

export class AlumnoNoAsignadoError extends ErrorDominio {
  readonly codigo = "ALUMNO_NO_ASIGNADO";
  constructor() {
    super("Ese alumno no pertenece a ninguna de tus secciones asignadas.");
  }
}
