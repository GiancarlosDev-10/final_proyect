import { describe, it, expect } from "vitest";
import { eliminarAsignacion } from "@/modulos/asignaciones/aplicacion/eliminar-asignacion";
import {
  crearAsignacion,
  FakeAsignacionRepositorio,
  crearBloqueHorario,
  FakeBloqueHorarioRepositorio,
} from "@/test/fixtures-notas";

describe("eliminarAsignacion", () => {
  it("retorna error si la asignación no existe", async () => {
    const repo = new FakeAsignacionRepositorio([]);
    const bloqueRepo = new FakeBloqueHorarioRepositorio([]);

    const resultado = await eliminarAsignacion("AS-NOPE", repo, bloqueRepo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("ASIGNACION_NO_ENCONTRADA");
  });

  it("borra la asignación y todos sus bloques de horario, sin tocar los de otra asignación", async () => {
    const repo = new FakeAsignacionRepositorio([crearAsignacion({ id: "AS-1" })]);
    const bloqueRepo = new FakeBloqueHorarioRepositorio([
      crearBloqueHorario({ id: "BLH-1", asignacionId: "AS-1" }),
      crearBloqueHorario({ id: "BLH-2", asignacionId: "AS-1" }),
      crearBloqueHorario({ id: "BLH-OTRA", asignacionId: "AS-OTRA" }),
    ]);

    const resultado = await eliminarAsignacion("AS-1", repo, bloqueRepo);

    expect(resultado.ok).toBe(true);
    expect(await repo.buscarPorId("AS-1")).toBeNull();
    expect((await bloqueRepo.listarPorAsignaciones(["AS-1"])).length).toBe(0);
    expect((await bloqueRepo.listarPorAsignaciones(["AS-OTRA"])).length).toBe(1);
  });
});
