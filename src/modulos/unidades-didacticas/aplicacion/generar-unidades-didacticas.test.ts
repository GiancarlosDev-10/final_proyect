import { describe, it, expect } from "vitest";
import { generarUnidadesDidacticas } from "@/modulos/unidades-didacticas/aplicacion/generar-unidades-didacticas";
import { fechaDeHoyISO } from "@/modulos/asistencia/dominio/tiempo";
import { crearPeriodo, FakePeriodoRepositorio, FakeUnidadDidacticaRepositorio } from "@/test/fixtures-notas";

describe("generarUnidadesDidacticas", () => {
  it("marca ABIERTA solo la unidad cuyo rango incluye la fecha de hoy", async () => {
    // Periodo que arranca hoy: la Unidad 1 (primer mes desde el inicio) incluye
    // hoy por definición, sin importar en qué fecha real corra el test.
    const hoy = fechaDeHoyISO();
    const finPeriodo = new Date(`${hoy}T00:00:00.000Z`);
    finPeriodo.setUTCMonth(finPeriodo.getUTCMonth() + 2);
    const periodoRepo = new FakePeriodoRepositorio([
      crearPeriodo({ fechaInicio: hoy, fechaFin: finPeriodo.toISOString().slice(0, 10) }),
    ]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([]);

    const resultado = await generarUnidadesDidacticas({ cursoId: "CUR-1", periodoId: "PER-1" }, unidadRepo, periodoRepo);

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    const [unidad1, unidad2] = resultado.value;
    expect(unidad1.estado).toBe("ABIERTO");
    expect(unidad2.estado).toBe("CERRADO");
  });

  it("marca CERRADAS ambas unidades si el periodo ya terminó", async () => {
    const periodoRepo = new FakePeriodoRepositorio([
      crearPeriodo({ fechaInicio: "2020-03-01", fechaFin: "2020-05-01" }),
    ]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([]);

    const resultado = await generarUnidadesDidacticas({ cursoId: "CUR-1", periodoId: "PER-1" }, unidadRepo, periodoRepo);

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.value.every((u) => u.estado === "CERRADO")).toBe(true);
  });

  it("es idempotente: no duplica si ya existen unidades para ese curso y periodo", async () => {
    const periodoRepo = new FakePeriodoRepositorio([crearPeriodo()]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([]);

    await generarUnidadesDidacticas({ cursoId: "CUR-1", periodoId: "PER-1" }, unidadRepo, periodoRepo);
    const segunda = await generarUnidadesDidacticas({ cursoId: "CUR-1", periodoId: "PER-1" }, unidadRepo, periodoRepo);

    expect(segunda.ok).toBe(true);
    const todas = await unidadRepo.listar();
    expect(todas).toHaveLength(2);
  });
});
