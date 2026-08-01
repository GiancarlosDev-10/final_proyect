import { describe, it, expect } from "vitest";
import { actualizarAsignacion } from "@/modulos/asignaciones/aplicacion/actualizar-asignacion";
import { crearAsignacion, FakeAsignacionRepositorio } from "@/test/fixtures-notas";

describe("actualizarAsignacion", () => {
  it("retorna error si la asignación no existe", async () => {
    const repo = new FakeAsignacionRepositorio([]);

    const resultado = await actualizarAsignacion(
      { id: "AS-NOPE", profesorId: "PROF-1", cursoId: "CUR-1", seccionId: "SEC-1", periodoId: "PER-1", activo: true },
      repo
    );

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("ASIGNACION_NO_ENCONTRADA");
  });

  it("retorna error si el cambio apunta a una combinación que ya usa OTRA asignación activa", async () => {
    const repo = new FakeAsignacionRepositorio([
      crearAsignacion({ id: "AS-1", profesorId: "PROF-1", cursoId: "CUR-1", seccionId: "SEC-1", periodoId: "PER-1" }),
      crearAsignacion({ id: "AS-2", profesorId: "PROF-1", cursoId: "CUR-1", seccionId: "SEC-2", periodoId: "PER-1" }),
    ]);

    const resultado = await actualizarAsignacion(
      { id: "AS-2", profesorId: "PROF-1", cursoId: "CUR-1", seccionId: "SEC-1", periodoId: "PER-1", activo: true },
      repo
    );

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("ASIGNACION_YA_EXISTE");
  });

  it("no se bloquea a sí misma cuando la combinación no cambia", async () => {
    const repo = new FakeAsignacionRepositorio([
      crearAsignacion({ id: "AS-1", profesorId: "PROF-1", cursoId: "CUR-1", seccionId: "SEC-1", periodoId: "PER-1", activo: true }),
    ]);

    const resultado = await actualizarAsignacion(
      { id: "AS-1", profesorId: "PROF-1", cursoId: "CUR-1", seccionId: "SEC-1", periodoId: "PER-1", activo: false },
      repo
    );

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.value.activo).toBe(false);
  });

  it("actualiza correctamente cuando la nueva combinación está libre", async () => {
    const repo = new FakeAsignacionRepositorio([
      crearAsignacion({ id: "AS-1", profesorId: "PROF-1", cursoId: "CUR-1", seccionId: "SEC-1", periodoId: "PER-1" }),
    ]);

    const resultado = await actualizarAsignacion(
      { id: "AS-1", profesorId: "PROF-1", cursoId: "CUR-1", seccionId: "SEC-2", periodoId: "PER-1", activo: true },
      repo
    );

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.value.seccionId).toBe("SEC-2");
  });
});
