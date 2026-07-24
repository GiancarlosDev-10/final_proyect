import { describe, it, expect } from "vitest";
import { generarUnidadesDidacticasPeriodo } from "@/modulos/unidades-didacticas/aplicacion/generar-unidades-didacticas-periodo";
import {
  crearCurso,
  crearPeriodo,
  FakeCursoRepositorio,
  FakePeriodoRepositorio,
  FakeUnidadDidacticaRepositorio,
} from "@/test/fixtures-notas";

describe("generarUnidadesDidacticasPeriodo", () => {
  it("genera Unidad 1 y Unidad 2 para todos los cursos activos del periodo", async () => {
    const cursoRepo = new FakeCursoRepositorio([
      crearCurso({ id: "CUR-1" }),
      crearCurso({ id: "CUR-2" }),
      crearCurso({ id: "CUR-3", activo: false }),
    ]);
    const periodoRepo = new FakePeriodoRepositorio([crearPeriodo()]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([]);

    const resultado = await generarUnidadesDidacticasPeriodo({ periodoId: "PER-1" }, cursoRepo, unidadRepo, periodoRepo);

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.value).toHaveLength(4); // 2 cursos activos x 2 unidades
    const todas = await unidadRepo.listar();
    expect(todas.every((u) => u.cursoId !== "CUR-3")).toBe(true);
  });

  it("es idempotente: correrlo de nuevo no duplica lo ya generado", async () => {
    const cursoRepo = new FakeCursoRepositorio([crearCurso({ id: "CUR-1" })]);
    const periodoRepo = new FakePeriodoRepositorio([crearPeriodo()]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([]);

    await generarUnidadesDidacticasPeriodo({ periodoId: "PER-1" }, cursoRepo, unidadRepo, periodoRepo);
    await generarUnidadesDidacticasPeriodo({ periodoId: "PER-1" }, cursoRepo, unidadRepo, periodoRepo);

    const todas = await unidadRepo.listar();
    expect(todas).toHaveLength(2);
  });

  it("retorna error si el periodo no existe", async () => {
    const cursoRepo = new FakeCursoRepositorio([crearCurso({ id: "CUR-1" })]);
    const periodoRepo = new FakePeriodoRepositorio([]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([]);

    const resultado = await generarUnidadesDidacticasPeriodo({ periodoId: "PER-1" }, cursoRepo, unidadRepo, periodoRepo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("PERIODO_NO_ENCONTRADO");
  });
});
