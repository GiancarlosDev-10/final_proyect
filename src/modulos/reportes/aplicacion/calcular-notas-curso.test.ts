import { describe, it, expect } from "vitest";
import { calcularNotasCurso } from "@/modulos/reportes/aplicacion/calcular-notas-curso";
import {
  crearAsignacion,
  crearMatricula,
  crearUnidadDidactica,
  crearNota,
  FakeMatriculaRepositorio,
  FakeAsignacionRepositorio,
  FakeUnidadDidacticaRepositorio,
  FakeNotaRepositorio,
} from "@/test/fixtures-notas";

describe("calcularNotasCurso", () => {
  it("calcula el desglose por tipo y el promedio ponderado de una sola asignación", async () => {
    const asignacionRepositorio = new FakeAsignacionRepositorio([
      crearAsignacion({ id: "ASI-1", cursoId: "CUR-COM", seccionId: "SEC-1", periodoId: "PER-1" }),
    ]);
    const matriculaRepositorio = new FakeMatriculaRepositorio([
      crearMatricula({ id: "MAT-1", estudianteId: "EST-1", seccionId: "SEC-1", anio: 2026 }),
    ]);
    const unidadDidacticaRepositorio = new FakeUnidadDidacticaRepositorio([
      crearUnidadDidactica({ id: "UDI-1", cursoId: "CUR-COM", periodoId: "PER-1", orden: 1 }),
    ]);
    const notaRepositorio = new FakeNotaRepositorio([
      crearNota({ id: "NOT-1", estudianteId: "EST-1", asignacionId: "ASI-1", periodoId: "PER-1", unidadDidacticaId: "UDI-1", tipo: "EXAMEN", valor: 16 }),
      crearNota({ id: "NOT-2", estudianteId: "EST-1", asignacionId: "ASI-1", periodoId: "PER-1", unidadDidacticaId: "UDI-1", tipo: "PRACTICA", valor: 10 }),
    ]);

    const resultado = await calcularNotasCurso(
      { asignacionId: "ASI-1", anio: 2026, ordenUnidad: 1 },
      { matriculaRepositorio, asignacionRepositorio, unidadDidacticaRepositorio, notaRepositorio }
    );

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    const fila = resultado.value.filas[0];
    expect(fila.porTipo.EXAMEN).toBe(16);
    expect(fila.porTipo.PRACTICA).toBe(10);
    expect(fila.porTipo.TRABAJO).toBe(null);
    expect(fila.porTipo.PARTICIPACION).toBe(null);
    // (16*0.4 + 10*0.2) / (0.4+0.2) = (6.4+2)/0.6 = 14
    expect(fila.promedio).toBe(14);
    expect(fila.letra).toBe("A");
  });

  it("deja el promedio en null si el alumno no tiene ninguna nota", async () => {
    const asignacionRepositorio = new FakeAsignacionRepositorio([
      crearAsignacion({ id: "ASI-1", cursoId: "CUR-COM", seccionId: "SEC-1", periodoId: "PER-1" }),
    ]);
    const matriculaRepositorio = new FakeMatriculaRepositorio([
      crearMatricula({ id: "MAT-1", estudianteId: "EST-1", seccionId: "SEC-1", anio: 2026 }),
    ]);
    const unidadDidacticaRepositorio = new FakeUnidadDidacticaRepositorio([
      crearUnidadDidactica({ id: "UDI-1", cursoId: "CUR-COM", periodoId: "PER-1", orden: 1 }),
    ]);
    const notaRepositorio = new FakeNotaRepositorio([]);

    const resultado = await calcularNotasCurso(
      { asignacionId: "ASI-1", anio: 2026, ordenUnidad: 1 },
      { matriculaRepositorio, asignacionRepositorio, unidadDidacticaRepositorio, notaRepositorio }
    );

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.value.filas[0].promedio).toBe(null);
    expect(resultado.value.filas[0].letra).toBe(null);
  });

  it("rechaza si la asignación no existe", async () => {
    const resultado = await calcularNotasCurso(
      { asignacionId: "ASI-NOPE", anio: 2026, ordenUnidad: 1 },
      {
        matriculaRepositorio: new FakeMatriculaRepositorio([]),
        asignacionRepositorio: new FakeAsignacionRepositorio([]),
        unidadDidacticaRepositorio: new FakeUnidadDidacticaRepositorio([]),
        notaRepositorio: new FakeNotaRepositorio([]),
      }
    );

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("ASIGNACION_NO_ENCONTRADA");
  });

  it("no mezcla notas de otras secciones/alumnos no matriculados", async () => {
    const asignacionRepositorio = new FakeAsignacionRepositorio([
      crearAsignacion({ id: "ASI-1", cursoId: "CUR-COM", seccionId: "SEC-1", periodoId: "PER-1" }),
    ]);
    const matriculaRepositorio = new FakeMatriculaRepositorio([
      crearMatricula({ id: "MAT-1", estudianteId: "EST-1", seccionId: "SEC-1", anio: 2026 }),
    ]);
    const unidadDidacticaRepositorio = new FakeUnidadDidacticaRepositorio([
      crearUnidadDidactica({ id: "UDI-1", cursoId: "CUR-COM", periodoId: "PER-1", orden: 1 }),
    ]);
    const notaRepositorio = new FakeNotaRepositorio([
      crearNota({ id: "NOT-1", estudianteId: "EST-1", asignacionId: "ASI-1", periodoId: "PER-1", unidadDidacticaId: "UDI-1", tipo: "EXAMEN", valor: 16 }),
      // Nota de otro alumno que no está matriculado en esta sección — no debe aparecer.
      crearNota({ id: "NOT-2", estudianteId: "EST-AJENO", asignacionId: "ASI-1", periodoId: "PER-1", unidadDidacticaId: "UDI-1", tipo: "EXAMEN", valor: 5 }),
    ]);

    const resultado = await calcularNotasCurso(
      { asignacionId: "ASI-1", anio: 2026, ordenUnidad: 1 },
      { matriculaRepositorio, asignacionRepositorio, unidadDidacticaRepositorio, notaRepositorio }
    );

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.value.filas).toHaveLength(1);
    expect(resultado.value.filas[0].estudianteId).toBe("EST-1");
    expect(resultado.value.filas[0].porTipo.EXAMEN).toBe(16);
  });
});
