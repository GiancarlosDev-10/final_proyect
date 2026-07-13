import { Asignacion, AsignacionProps } from "@/modulos/asignaciones/dominio/asignacion";
import { IAsignacionRepositorio } from "@/modulos/asignaciones/aplicacion/i-asignacion-repositorio";
import { Periodo, PeriodoProps } from "@/modulos/periodos/dominio/periodo";
import { IPeriodoRepositorio } from "@/modulos/periodos/aplicacion/i-periodo-repositorio";
import { Nota, NotaProps } from "@/modulos/notas/dominio/nota";
import { INotaRepositorio } from "@/modulos/notas/aplicacion/i-nota-repositorio";
import { UnidadDidactica, UnidadDidacticaProps } from "@/modulos/unidades-didacticas/dominio/unidad-didactica";
import { IUnidadDidacticaRepositorio } from "@/modulos/unidades-didacticas/aplicacion/i-unidad-didactica-repositorio";
import { Curso, CursoProps } from "@/modulos/cursos/dominio/curso";
import { ICursoRepositorio } from "@/modulos/cursos/aplicacion/i-curso-repositorio";
import { BloqueHorario, BloqueHorarioProps } from "@/modulos/horarios/dominio/bloque-horario";
import { IBloqueHorarioRepositorio } from "@/modulos/horarios/aplicacion/i-bloque-horario-repositorio";
import { Recordatorio, RecordatorioProps } from "@/modulos/recordatorios/dominio/recordatorio";
import { IRecordatorioRepositorio } from "@/modulos/recordatorios/aplicacion/i-recordatorio-repositorio";
import {
  ESTADOS_PERIODO,
  ESTADOS_UNIDAD_DIDACTICA,
  TIPOS_NOTA,
  TIPOS_RECORDATORIO,
  DIAS_SEMANA,
} from "@/config/constantes";

const AHORA = "2026-01-01T00:00:00.000Z";

export function crearAsignacion(overrides: Partial<AsignacionProps> = {}): Asignacion {
  return new Asignacion({
    id: "AS-1",
    profesorId: "PROF-1",
    cursoId: "CUR-1",
    seccionId: "SEC-1",
    periodoId: "PER-1",
    activo: true,
    creadoEn: AHORA,
    actualizadoEn: AHORA,
    ...overrides,
  });
}

export function crearPeriodo(overrides: Partial<PeriodoProps> = {}): Periodo {
  return new Periodo({
    id: "PER-1",
    nombre: "Bimestre 1",
    anio: 2026,
    estado: ESTADOS_PERIODO.ABIERTO,
    fechaInicio: "2026-03-01",
    fechaFin: "2026-05-01",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
    ...overrides,
  });
}

export function crearCurso(overrides: Partial<CursoProps> = {}): Curso {
  return new Curso({
    id: "CUR-1",
    nombre: "Álgebra",
    areaId: "ARE-1",
    activo: true,
    creadoEn: AHORA,
    actualizadoEn: AHORA,
    ...overrides,
  });
}

export function crearUnidadDidactica(overrides: Partial<UnidadDidacticaProps> = {}): UnidadDidactica {
  return new UnidadDidactica({
    id: "UDI-1",
    nombre: "Mes 1",
    periodoId: "PER-1",
    estado: ESTADOS_UNIDAD_DIDACTICA.ABIERTO,
    creadoEn: AHORA,
    actualizadoEn: AHORA,
    ...overrides,
  });
}

export function crearNota(overrides: Partial<NotaProps> = {}): Nota {
  return new Nota({
    id: "NOT-1",
    estudianteId: "EST-1",
    asignacionId: "AS-1",
    periodoId: "PER-1",
    tipo: TIPOS_NOTA.PRACTICA,
    etiqueta: "Práctica 1",
    valor: 15,
    fecha: "2026-03-10",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
    ...overrides,
  });
}

export class FakeAsignacionRepositorio implements IAsignacionRepositorio {
  constructor(private asignaciones: Asignacion[] = []) {}

  async buscarPorId(id: string): Promise<Asignacion | null> {
    return this.asignaciones.find((a) => a.id === id) ?? null;
  }

  async buscarActiva(profesorId: string, cursoId: string, seccionId: string, periodoId: string): Promise<Asignacion | null> {
    return (
      this.asignaciones.find(
        (a) =>
          a.profesorId === profesorId &&
          a.cursoId === cursoId &&
          a.seccionId === seccionId &&
          a.periodoId === periodoId &&
          a.activo
      ) ?? null
    );
  }

  async listar(): Promise<Asignacion[]> {
    return this.asignaciones;
  }

  async listarPorProfesor(profesorId: string): Promise<Asignacion[]> {
    return this.asignaciones.filter((a) => a.profesorId === profesorId);
  }

  async crear(asignacion: Asignacion): Promise<void> {
    this.asignaciones.push(asignacion);
  }

  async actualizar(asignacion: Asignacion): Promise<void> {
    this.asignaciones = this.asignaciones.map((a) => (a.id === asignacion.id ? asignacion : a));
  }

  async eliminar(id: string): Promise<void> {
    this.asignaciones = this.asignaciones.filter((a) => a.id !== id);
  }
}

export class FakePeriodoRepositorio implements IPeriodoRepositorio {
  constructor(private periodos: Periodo[] = []) {}

  async buscarPorId(id: string): Promise<Periodo | null> {
    return this.periodos.find((p) => p.id === id) ?? null;
  }

  async listar(): Promise<Periodo[]> {
    return this.periodos;
  }

  async crear(periodo: Periodo): Promise<void> {
    this.periodos.push(periodo);
  }

  async actualizar(periodo: Periodo): Promise<void> {
    this.periodos = this.periodos.map((p) => (p.id === periodo.id ? periodo : p));
  }

  async eliminar(id: string): Promise<void> {
    this.periodos = this.periodos.filter((p) => p.id !== id);
  }
}

export function crearBloqueHorario(overrides: Partial<BloqueHorarioProps> = {}): BloqueHorario {
  return new BloqueHorario({
    id: "BLH-1",
    asignacionId: "AS-1",
    profesorId: "PROF-1",
    diaSemana: DIAS_SEMANA.LUNES,
    horaInicio: "08:00",
    horaFin: "08:45",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
    ...overrides,
  });
}

export class FakeBloqueHorarioRepositorio implements IBloqueHorarioRepositorio {
  constructor(private bloques: BloqueHorario[] = []) {}

  async buscarPorId(id: string): Promise<BloqueHorario | null> {
    return this.bloques.find((b) => b.id === id) ?? null;
  }

  async listarPorProfesor(profesorId: string): Promise<BloqueHorario[]> {
    return this.bloques.filter((b) => b.profesorId === profesorId);
  }

  async crear(bloque: BloqueHorario): Promise<void> {
    this.bloques.push(bloque);
  }

  async actualizar(bloque: BloqueHorario): Promise<void> {
    this.bloques = this.bloques.map((b) => (b.id === bloque.id ? bloque : b));
  }

  async eliminar(id: string): Promise<void> {
    this.bloques = this.bloques.filter((b) => b.id !== id);
  }
}

export function crearRecordatorio(overrides: Partial<RecordatorioProps> = {}): Recordatorio {
  return new Recordatorio({
    id: "REC-1",
    profesorId: "PROF-1",
    fecha: "2026-07-13",
    titulo: "Reunión con el padre de Giancarlos",
    tipo: TIPOS_RECORDATORIO.REUNION_PADRE,
    creadoEn: AHORA,
    actualizadoEn: AHORA,
    ...overrides,
  });
}

export class FakeRecordatorioRepositorio implements IRecordatorioRepositorio {
  constructor(private recordatorios: Recordatorio[] = []) {}

  async buscarPorId(id: string): Promise<Recordatorio | null> {
    return this.recordatorios.find((r) => r.id === id) ?? null;
  }

  async listarPorProfesor(profesorId: string): Promise<Recordatorio[]> {
    return this.recordatorios.filter((r) => r.profesorId === profesorId);
  }

  async crear(recordatorio: Recordatorio): Promise<void> {
    this.recordatorios.push(recordatorio);
  }

  async actualizar(recordatorio: Recordatorio): Promise<void> {
    this.recordatorios = this.recordatorios.map((r) => (r.id === recordatorio.id ? recordatorio : r));
  }

  async eliminar(id: string): Promise<void> {
    this.recordatorios = this.recordatorios.filter((r) => r.id !== id);
  }
}

export class FakeCursoRepositorio implements ICursoRepositorio {
  constructor(private cursos: Curso[] = []) {}

  async buscarPorId(id: string): Promise<Curso | null> {
    return this.cursos.find((c) => c.id === id) ?? null;
  }

  async listar(): Promise<Curso[]> {
    return this.cursos;
  }

  async listarPorArea(areaId: string): Promise<Curso[]> {
    return this.cursos.filter((c) => c.areaId === areaId);
  }

  async crear(curso: Curso): Promise<void> {
    this.cursos.push(curso);
  }

  async actualizar(curso: Curso): Promise<void> {
    this.cursos = this.cursos.map((c) => (c.id === curso.id ? curso : c));
  }

  async eliminar(id: string): Promise<void> {
    this.cursos = this.cursos.filter((c) => c.id !== id);
  }
}

export class FakeUnidadDidacticaRepositorio implements IUnidadDidacticaRepositorio {
  constructor(private unidades: UnidadDidactica[] = []) {}

  async buscarPorId(id: string): Promise<UnidadDidactica | null> {
    return this.unidades.find((u) => u.id === id) ?? null;
  }

  async listar(): Promise<UnidadDidactica[]> {
    return this.unidades;
  }

  async listarPorPeriodo(periodoId: string): Promise<UnidadDidactica[]> {
    return this.unidades.filter((u) => u.periodoId === periodoId);
  }

  async crear(unidadDidactica: UnidadDidactica): Promise<void> {
    this.unidades.push(unidadDidactica);
  }

  async actualizar(unidadDidactica: UnidadDidactica): Promise<void> {
    this.unidades = this.unidades.map((u) => (u.id === unidadDidactica.id ? unidadDidactica : u));
  }

  async eliminar(id: string): Promise<void> {
    this.unidades = this.unidades.filter((u) => u.id !== id);
  }
}

export class FakeNotaRepositorio implements INotaRepositorio {
  constructor(private notas: Nota[] = []) {}

  async buscarPorId(id: string): Promise<Nota | null> {
    return this.notas.find((n) => n.id === id) ?? null;
  }

  async listarPorAsignacion(asignacionId: string): Promise<Nota[]> {
    return this.notas.filter((n) => n.asignacionId === asignacionId);
  }

  async listarPorEstudiante(estudianteId: string): Promise<Nota[]> {
    return this.notas.filter((n) => n.estudianteId === estudianteId);
  }

  async listarPorPeriodo(periodoId: string): Promise<Nota[]> {
    return this.notas.filter((n) => n.periodoId === periodoId);
  }

  async crear(nota: Nota): Promise<void> {
    this.notas.push(nota);
  }

  async actualizar(nota: Nota): Promise<void> {
    this.notas = this.notas.map((n) => (n.id === nota.id ? nota : n));
  }

  async eliminar(id: string): Promise<void> {
    this.notas = this.notas.filter((n) => n.id !== id);
  }

  todas(): Nota[] {
    return this.notas;
  }
}
