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

  it("retorna error si la sección ya tiene otra clase (de otro profesor) en ese día y horario", async () => {
    const repo = new FakeBloqueHorarioRepositorio([
      crearBloqueHorarioFixture({
        id: "BLH-OTRA-CLASE",
        asignacionId: "AS-OTRO-CURSO",
        profesorId: "PROF-OTRO",
        diaSemana: DIAS_SEMANA.MARTES,
        horaInicio: "09:00",
        horaFin: "09:45",
      }),
    ]);
    const asignacionRepo = new FakeAsignacionRepositorio([
      crearAsignacion({ id: "AS-1", profesorId: "PROF-1", seccionId: "SEC-1", periodoId: "PER-1" }),
      crearAsignacion({ id: "AS-OTRO-CURSO", profesorId: "PROF-OTRO", cursoId: "CUR-OTRO", seccionId: "SEC-1", periodoId: "PER-1" }),
    ]);

    const resultado = await crearBloqueHorario(DATOS_BASE, repo, asignacionRepo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("SECCION_OCUPADA_EN_HORARIO");
  });

  it("no bloquea por sección si la clase que se superpone es de otra sección o periodo", async () => {
    const repo = new FakeBloqueHorarioRepositorio([
      crearBloqueHorarioFixture({
        id: "BLH-OTRA-SECCION",
        asignacionId: "AS-OTRA-SECCION",
        profesorId: "PROF-OTRO",
        diaSemana: DIAS_SEMANA.MARTES,
        horaInicio: "09:00",
        horaFin: "09:45",
      }),
    ]);
    const asignacionRepo = new FakeAsignacionRepositorio([
      crearAsignacion({ id: "AS-1", profesorId: "PROF-1", seccionId: "SEC-1", periodoId: "PER-1" }),
      crearAsignacion({ id: "AS-OTRA-SECCION", profesorId: "PROF-OTRO", cursoId: "CUR-OTRO", seccionId: "SEC-2", periodoId: "PER-1" }),
    ]);

    const resultado = await crearBloqueHorario(DATOS_BASE, repo, asignacionRepo);

    expect(resultado.ok).toBe(true);
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
