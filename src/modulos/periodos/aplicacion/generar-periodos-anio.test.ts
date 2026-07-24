import { describe, it, expect } from "vitest";
import { generarPeriodosAnio } from "@/modulos/periodos/aplicacion/generar-periodos-anio";
import { crearPeriodo, FakePeriodoRepositorio } from "@/test/fixtures-notas";

describe("generarPeriodosAnio", () => {
  it("crea los 4 periodos del año con fechas predeterminadas", async () => {
    const repositorio = new FakePeriodoRepositorio([]);

    const resultado = await generarPeriodosAnio({ anio: 2027 }, repositorio);

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.value).toHaveLength(4);
    expect(resultado.value.map((p) => p.nombre)).toEqual(["Periodo 1", "Periodo 2", "Periodo 3", "Periodo 4"]);
    expect(resultado.value.every((p) => p.anio === 2027)).toBe(true);

    const guardados = await repositorio.listar();
    expect(guardados).toHaveLength(4);
  });

  it("deja el hueco de vacaciones de medio año entre el Periodo 2 y el Periodo 3", async () => {
    const repositorio = new FakePeriodoRepositorio([]);

    const resultado = await generarPeriodosAnio({ anio: 2027 }, repositorio);

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    const [, periodo2, periodo3] = resultado.value;
    expect(periodo2.fechaFin < "2027-07-27").toBe(true);
    expect(periodo3.fechaInicio > "2027-08-07").toBe(true);
  });

  it("marca ABIERTO solo el periodo cuyo rango incluye la fecha de hoy, y CERRADO el resto", async () => {
    const repositorio = new FakePeriodoRepositorio([]);

    // Un año pasado: ningún periodo debería incluir "hoy", todos quedan CERRADO.
    const resultado = await generarPeriodosAnio({ anio: 2020 }, repositorio);

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.value.every((p) => p.estado === "CERRADO")).toBe(true);
  });

  it("retorna error si ya existen periodos para ese año", async () => {
    const repositorio = new FakePeriodoRepositorio([crearPeriodo({ anio: 2026 })]);

    const resultado = await generarPeriodosAnio({ anio: 2026 }, repositorio);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("PERIODOS_ANIO_YA_EXISTEN");
    const guardados = await repositorio.listar();
    expect(guardados).toHaveLength(1);
  });
});
