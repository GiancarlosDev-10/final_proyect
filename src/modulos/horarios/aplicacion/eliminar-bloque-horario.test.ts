import { describe, it, expect } from "vitest";
import { eliminarBloqueHorario } from "@/modulos/horarios/aplicacion/eliminar-bloque-horario";
import { crearBloqueHorario, FakeBloqueHorarioRepositorio } from "@/test/fixtures-notas";

describe("eliminarBloqueHorario", () => {
  it("retorna error si el bloque no existe", async () => {
    const repo = new FakeBloqueHorarioRepositorio([]);
    const resultado = await eliminarBloqueHorario("BLH-1", "PROF-1", repo);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("BLOQUE_HORARIO_NO_ENCONTRADO");
  });

  it("retorna error si el bloque pertenece a otro profesor (sin revelar que existe)", async () => {
    const repo = new FakeBloqueHorarioRepositorio([crearBloqueHorario({ id: "BLH-1", profesorId: "PROF-OTRO" })]);
    const resultado = await eliminarBloqueHorario("BLH-1", "PROF-1", repo);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("BLOQUE_HORARIO_NO_ENCONTRADO");
    expect(await repo.buscarPorId("BLH-1")).not.toBeNull();
  });

  it("elimina el bloque si pertenece al profesor", async () => {
    const repo = new FakeBloqueHorarioRepositorio([crearBloqueHorario({ id: "BLH-1", profesorId: "PROF-1" })]);
    const resultado = await eliminarBloqueHorario("BLH-1", "PROF-1", repo);
    expect(resultado.ok).toBe(true);
    expect(await repo.buscarPorId("BLH-1")).toBeNull();
  });
});
