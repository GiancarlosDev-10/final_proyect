import { describe, it, expect } from "vitest";
import { calcularConsolidadoSeccion, letraDeNota } from "@/modulos/reportes/aplicacion/calcular-consolidado-seccion";
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

describe("letraDeNota", () => {
  it("mapea la escala oficial EBR", () => {
    expect(letraDeNota(20)).toBe("AD");
    expect(letraDeNota(18)).toBe("AD");
    expect(letraDeNota(17)).toBe("A");
    expect(letraDeNota(14)).toBe("A");
    expect(letraDeNota(13)).toBe("B");
    expect(letraDeNota(11)).toBe("B");
    expect(letraDeNota(10)).toBe("C");
    expect(letraDeNota(0)).toBe("C");
    expect(letraDeNota(null)).toBe(null);
  });
});

describe("calcularConsolidadoSeccion", () => {
  it("calcula el promedio por curso, el puntaje y el orden de mérito de toda la sección", async () => {
    const matriculaRepositorio = new FakeMatriculaRepositorio([
      crearMatricula({ id: "MAT-1", estudianteId: "EST-1", seccionId: "SEC-1", anio: 2026 }),
      crearMatricula({ id: "MAT-2", estudianteId: "EST-2", seccionId: "SEC-1", anio: 2026 }),
    ]);
    const asignacionRepositorio = new FakeAsignacionRepositorio([
      crearAsignacion({ id: "ASI-1", cursoId: "CUR-MATE", seccionId: "SEC-1", periodoId: "PER-1" }),
      crearAsignacion({ id: "ASI-2", cursoId: "CUR-COM", seccionId: "SEC-1", periodoId: "PER-1" }),
    ]);
    const unidadDidacticaRepositorio = new FakeUnidadDidacticaRepositorio([
      crearUnidadDidactica({ id: "UDI-MATE-1", cursoId: "CUR-MATE", periodoId: "PER-1", orden: 1 }),
      crearUnidadDidactica({ id: "UDI-COM-1", cursoId: "CUR-COM", periodoId: "PER-1", orden: 1 }),
    ]);
    const notaRepositorio = new FakeNotaRepositorio([
      crearNota({ id: "NOT-1", estudianteId: "EST-1", asignacionId: "ASI-1", periodoId: "PER-1", unidadDidacticaId: "UDI-MATE-1", valor: 18 }),
      crearNota({ id: "NOT-2", estudianteId: "EST-1", asignacionId: "ASI-2", periodoId: "PER-1", unidadDidacticaId: "UDI-COM-1", valor: 12 }),
      crearNota({ id: "NOT-3", estudianteId: "EST-2", asignacionId: "ASI-1", periodoId: "PER-1", unidadDidacticaId: "UDI-MATE-1", valor: 10 }),
      crearNota({ id: "NOT-4", estudianteId: "EST-2", asignacionId: "ASI-2", periodoId: "PER-1", unidadDidacticaId: "UDI-COM-1", valor: 10 }),
    ]);

    const resultado = await calcularConsolidadoSeccion(
      { seccionId: "SEC-1", periodoId: "PER-1", anio: 2026, ordenUnidad: 1 },
      { matriculaRepositorio, asignacionRepositorio, unidadDidacticaRepositorio, notaRepositorio }
    );

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;

    expect(resultado.value.cursoIds.sort()).toEqual(["CUR-COM", "CUR-MATE"]);

    const fila1 = resultado.value.filas.find((f) => f.estudianteId === "EST-1")!;
    const fila2 = resultado.value.filas.find((f) => f.estudianteId === "EST-2")!;

    expect(fila1.notasPorCurso.find((n) => n.cursoId === "CUR-MATE")?.promedio).toBe(18);
    expect(fila1.notasPorCurso.find((n) => n.cursoId === "CUR-MATE")?.letra).toBe("AD");
    expect(fila1.puntaje).toBe(30); // 18 + 12
    expect(fila2.puntaje).toBe(20); // 10 + 10

    // EST-1 tiene más puntaje, así que debe ir primero en el orden de mérito.
    expect(fila1.ordenMerito).toBe(1);
    expect(fila2.ordenMerito).toBe(2);
  });

  it("deja el curso en null si no hay Unidad Didáctica generada para ese orden", async () => {
    const matriculaRepositorio = new FakeMatriculaRepositorio([crearMatricula({ estudianteId: "EST-1", seccionId: "SEC-1", anio: 2026 })]);
    const asignacionRepositorio = new FakeAsignacionRepositorio([
      crearAsignacion({ id: "ASI-1", cursoId: "CUR-MATE", seccionId: "SEC-1", periodoId: "PER-1" }),
    ]);
    const unidadDidacticaRepositorio = new FakeUnidadDidacticaRepositorio([]);
    const notaRepositorio = new FakeNotaRepositorio([]);

    const resultado = await calcularConsolidadoSeccion(
      { seccionId: "SEC-1", periodoId: "PER-1", anio: 2026, ordenUnidad: 1 },
      { matriculaRepositorio, asignacionRepositorio, unidadDidacticaRepositorio, notaRepositorio }
    );

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.value.filas[0].notasPorCurso[0].promedio).toBe(null);
    expect(resultado.value.filas[0].puntaje).toBe(null);
    expect(resultado.value.filas[0].ordenMerito).toBe(null);
  });

  it("no incluye matrículas inactivas ni de otro año", async () => {
    const matriculaRepositorio = new FakeMatriculaRepositorio([
      crearMatricula({ estudianteId: "EST-1", seccionId: "SEC-1", anio: 2026, activo: true }),
      crearMatricula({ id: "MAT-2", estudianteId: "EST-2", seccionId: "SEC-1", anio: 2026, activo: false }),
      crearMatricula({ id: "MAT-3", estudianteId: "EST-3", seccionId: "SEC-1", anio: 2025, activo: true }),
    ]);
    const asignacionRepositorio = new FakeAsignacionRepositorio([]);
    const unidadDidacticaRepositorio = new FakeUnidadDidacticaRepositorio([]);
    const notaRepositorio = new FakeNotaRepositorio([]);

    const resultado = await calcularConsolidadoSeccion(
      { seccionId: "SEC-1", periodoId: "PER-1", anio: 2026, ordenUnidad: 1 },
      { matriculaRepositorio, asignacionRepositorio, unidadDidacticaRepositorio, notaRepositorio }
    );

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.value.filas).toHaveLength(1);
    expect(resultado.value.filas[0].estudianteId).toBe("EST-1");
  });
});
