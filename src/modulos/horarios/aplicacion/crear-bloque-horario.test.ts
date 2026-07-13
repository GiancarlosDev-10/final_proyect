import { describe, it, expect } from "vitest";
import { crearBloqueHorario } from "@/modulos/horarios/aplicacion/crear-bloque-horario";
import { DIAS_SEMANA } from "@/config/constantes";
import {
  crearAsignacion,
  crearBloqueHorario as crearBloqueHorarioFixture,
  FakeAsignacionRepositorio,
  FakeBloqueHorarioRepositorio,
} from "@/test/fixtures-notas";

const DATOS_BASE = {
  asignacionId: "AS-1",
  profesorId: "PROF-1",
  diaSemana: DIAS_SEMANA.MARTES,
  horaInicio: "09:00",
  horaFin: "09:45",
};

describe("crearBloqueHorario", () => {
  it("retorna error si la asignación no existe o no pertenece al profesor", async () => {
    const repo = new FakeBloqueHorarioRepositorio([]);
    const asignacionRepo = new FakeAsignacionRepositorio([crearAsignacion({ id: "AS-1", profesorId: "PROF-OTRO" })]);

    const resultado = await crearBloqueHorario(DATOS_BASE, repo, asignacionRepo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("ASIGNACION_NO_ENCONTRADA");
  });

  it("retorna error si el nuevo bloque se superpone con uno existente del profesor", async () => {
    const repo = new FakeBloqueHorarioRepositorio([
      crearBloqueHorarioFixture({ id: "BLH-EXISTENTE", diaSemana: DIAS_SEMANA.MARTES, horaInicio: "09:00", horaFin: "09:45" }),
    ]);
    const asignacionRepo = new FakeAsignacionRepositorio([crearAsignacion({ id: "AS-1", profesorId: "PROF-1" })]);

    const resultado = await crearBloqueHorario(DATOS_BASE, repo, asignacionRepo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("BLOQUE_HORARIO_SUPERPUESTO");
  });

  it("crea el bloque si la asignación es propia y no hay superposición", async () => {
    const repo = new FakeBloqueHorarioRepositorio([]);
    const asignacionRepo = new FakeAsignacionRepositorio([crearAsignacion({ id: "AS-1", profesorId: "PROF-1" })]);

    const resultado = await crearBloqueHorario(DATOS_BASE, repo, asignacionRepo);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value.diaSemana).toBe(DIAS_SEMANA.MARTES);
      expect(resultado.value.horaInicio).toBe("09:00");
    }
  });
});
