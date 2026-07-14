import { describe, it, expect } from "vitest";
import { calcularPromedioCurso } from "@/modulos/reportes/aplicacion/calcular-promedio-curso";
import {
  crearAsignacion,
  crearNota,
  crearUnidadDidactica,
  FakeAsignacionRepositorio,
  FakeNotaRepositorio,
  FakeUnidadDidacticaRepositorio,
} from "@/test/fixtures-notas";

const DATOS_BASE = { estudianteId: "EST-1", cursoId: "CUR-1", periodoId: "PER-1" };

describe("calcularPromedioCurso", () => {
  it("promedia las notas por unidad y calcula el promedio bimestral, ignorando notas de otras asignaciones", async () => {
    const asignacionRepo = new FakeAsignacionRepositorio([
      crearAsignacion({ id: "AS-1", cursoId: "CUR-1", periodoId: "PER-1" }),
      crearAsignacion({ id: "AS-2", cursoId: "CUR-2", periodoId: "PER-1" }),
    ]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([
      crearUnidadDidactica({ id: "UDI-1", cursoId: "CUR-1", periodoId: "PER-1", orden: 1 }),
      crearUnidadDidactica({ id: "UDI-2", cursoId: "CUR-1", periodoId: "PER-1", orden: 2 }),
    ]);
    const notaRepo = new FakeNotaRepositorio([
      crearNota({ id: "NOT-1", asignacionId: "AS-1", unidadDidacticaId: "UDI-1", valor: 14 }),
      crearNota({ id: "NOT-2", asignacionId: "AS-1", unidadDidacticaId: "UDI-1", valor: 16 }),
      crearNota({ id: "NOT-3", asignacionId: "AS-1", unidadDidacticaId: "UDI-2", valor: 18 }),
      crearNota({ id: "NOT-RUIDO", asignacionId: "AS-2", unidadDidacticaId: "UDI-1", valor: 5 }),
    ]);

    const resultado = await calcularPromedioCurso(DATOS_BASE, notaRepo, asignacionRepo, unidadRepo);

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.value.promediosPorUnidad).toEqual([
      { unidadDidacticaId: "UDI-1", orden: 1, promedio: 15 },
      { unidadDidacticaId: "UDI-2", orden: 2, promedio: 18 },
    ]);
    expect(resultado.value.promedioBimestral).toBe(16.5);
  });

  it("marca como null la unidad sin notas y la excluye del promedio bimestral", async () => {
    const asignacionRepo = new FakeAsignacionRepositorio([crearAsignacion({ id: "AS-1", cursoId: "CUR-1", periodoId: "PER-1" })]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([
      crearUnidadDidactica({ id: "UDI-1", cursoId: "CUR-1", periodoId: "PER-1", orden: 1 }),
      crearUnidadDidactica({ id: "UDI-2", cursoId: "CUR-1", periodoId: "PER-1", orden: 2 }),
    ]);
    const notaRepo = new FakeNotaRepositorio([
      crearNota({ id: "NOT-1", asignacionId: "AS-1", unidadDidacticaId: "UDI-1", valor: 12 }),
    ]);

    const resultado = await calcularPromedioCurso(DATOS_BASE, notaRepo, asignacionRepo, unidadRepo);

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.value.promediosPorUnidad).toEqual([
      { unidadDidacticaId: "UDI-1", orden: 1, promedio: 12 },
      { unidadDidacticaId: "UDI-2", orden: 2, promedio: null },
    ]);
    expect(resultado.value.promedioBimestral).toBe(12);
  });

  it("retorna promedios null si el estudiante no tiene notas en ese curso/periodo", async () => {
    const asignacionRepo = new FakeAsignacionRepositorio([crearAsignacion({ id: "AS-1", cursoId: "CUR-1", periodoId: "PER-1" })]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([crearUnidadDidactica({ id: "UDI-1", cursoId: "CUR-1", periodoId: "PER-1", orden: 1 })]);
    const notaRepo = new FakeNotaRepositorio([]);

    const resultado = await calcularPromedioCurso(DATOS_BASE, notaRepo, asignacionRepo, unidadRepo);

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.value.promediosPorUnidad).toEqual([{ unidadDidacticaId: "UDI-1", orden: 1, promedio: null }]);
    expect(resultado.value.promedioBimestral).toBeNull();
  });
});
