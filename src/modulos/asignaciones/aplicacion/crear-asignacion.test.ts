import { describe, it, expect } from "vitest";
import { crearAsignacion } from "@/modulos/asignaciones/aplicacion/crear-asignacion";
import { crearAsignacion as crearAsignacionFixture, FakeAsignacionRepositorio } from "@/test/fixtures-notas";

const DATOS_BASE = {
  profesorId: "PROF-1",
  cursoId: "CUR-1",
  seccionId: "SEC-1",
  periodoId: "PER-1",
};

describe("crearAsignacion", () => {
  it("retorna error amigable si ya existe una asignación activa con esos mismos datos (en vez del error crudo de Mongo)", async () => {
    const repo = new FakeAsignacionRepositorio([
      crearAsignacionFixture({ id: "AS-EXISTENTE", profesorId: "PROF-1", cursoId: "CUR-1", seccionId: "SEC-1", periodoId: "PER-1" }),
    ]);

    const resultado = await crearAsignacion(DATOS_BASE, repo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("ASIGNACION_YA_EXISTE");
  });

  it("no bloquea si la asignación existente está inactiva", async () => {
    const repo = new FakeAsignacionRepositorio([
      crearAsignacionFixture({ id: "AS-INACTIVA", profesorId: "PROF-1", cursoId: "CUR-1", seccionId: "SEC-1", periodoId: "PER-1", activo: false }),
    ]);

    const resultado = await crearAsignacion(DATOS_BASE, repo);

    expect(resultado.ok).toBe(true);
  });

  it("no bloquea si el profesor ya dicta ese curso pero en otra sección", async () => {
    const repo = new FakeAsignacionRepositorio([
      crearAsignacionFixture({ id: "AS-OTRA-SECCION", profesorId: "PROF-1", cursoId: "CUR-1", seccionId: "SEC-2", periodoId: "PER-1" }),
    ]);

    const resultado = await crearAsignacion(DATOS_BASE, repo);

    expect(resultado.ok).toBe(true);
  });

  it("crea la asignación cuando no existe una activa igual", async () => {
    const repo = new FakeAsignacionRepositorio([]);

    const resultado = await crearAsignacion(DATOS_BASE, repo);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value.profesorId).toBe("PROF-1");
      expect(resultado.value.activo).toBe(true);
    }
  });
});
