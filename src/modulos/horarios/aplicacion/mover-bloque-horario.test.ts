import { describe, it, expect } from "vitest";
import { moverBloqueHorario } from "@/modulos/horarios/aplicacion/mover-bloque-horario";
import { DIAS_SEMANA } from "@/config/constantes";
import {
  crearBloqueHorario,
  FakeBloqueHorarioRepositorio,
  crearAsignacion,
  FakeAsignacionRepositorio,
} from "@/test/fixtures-notas";

const SIN_ASIGNACIONES = new FakeAsignacionRepositorio([]);

describe("moverBloqueHorario", () => {
  it("retorna error si el bloque no existe o pertenece a otro profesor", async () => {
    const repo = new FakeBloqueHorarioRepositorio([crearBloqueHorario({ id: "BLH-1", profesorId: "PROF-OTRO" })]);

    const resultado = await moverBloqueHorario(
      { id: "BLH-1", profesorId: "PROF-1", diaSemana: DIAS_SEMANA.VIERNES, horaInicio: "08:00", horaFin: "08:45" },
      repo,
      SIN_ASIGNACIONES
    );

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("BLOQUE_HORARIO_NO_ENCONTRADO");
  });

  it("retorna error si el destino se superpone con otro bloque del mismo profesor en el mismo periodo", async () => {
    // Ambos bloques cuelgan de asignaciones del mismo profesor y periodo —
    // es la situación real que debe seguir bloqueada.
    const asignacionRepo = new FakeAsignacionRepositorio([
      crearAsignacion({ id: "AS-1", profesorId: "PROF-1", periodoId: "PER-1" }),
      crearAsignacion({ id: "AS-2", profesorId: "PROF-1", periodoId: "PER-1", cursoId: "CUR-2" }),
    ]);
    const repo = new FakeBloqueHorarioRepositorio([
      crearBloqueHorario({ id: "BLH-1", asignacionId: "AS-1", profesorId: "PROF-1", diaSemana: DIAS_SEMANA.LUNES, horaInicio: "08:00", horaFin: "08:45" }),
      crearBloqueHorario({ id: "BLH-2", asignacionId: "AS-2", profesorId: "PROF-1", diaSemana: DIAS_SEMANA.VIERNES, horaInicio: "08:00", horaFin: "08:45" }),
    ]);

    const resultado = await moverBloqueHorario(
      { id: "BLH-1", profesorId: "PROF-1", diaSemana: DIAS_SEMANA.VIERNES, horaInicio: "08:00", horaFin: "08:45" },
      repo,
      asignacionRepo
    );

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("BLOQUE_HORARIO_SUPERPUESTO");
  });

  it("NO bloquea si el choque es contra un bloque del mismo profesor pero de OTRO periodo (ej. el bimestre siguiente repite el mismo horario semanal)", async () => {
    const asignacionRepo = new FakeAsignacionRepositorio([
      crearAsignacion({ id: "AS-1", profesorId: "PROF-1", periodoId: "PER-1" }),
      crearAsignacion({ id: "AS-2", profesorId: "PROF-1", periodoId: "PER-2", cursoId: "CUR-2" }),
    ]);
    const repo = new FakeBloqueHorarioRepositorio([
      crearBloqueHorario({ id: "BLH-1", asignacionId: "AS-1", profesorId: "PROF-1", diaSemana: DIAS_SEMANA.LUNES, horaInicio: "08:00", horaFin: "08:45" }),
      // Mismo día/hora que el destino de BLH-1, pero en PER-2 (otro bimestre) — no debería contar como choque.
      crearBloqueHorario({ id: "BLH-2", asignacionId: "AS-2", profesorId: "PROF-1", diaSemana: DIAS_SEMANA.VIERNES, horaInicio: "08:00", horaFin: "08:45" }),
    ]);

    const resultado = await moverBloqueHorario(
      { id: "BLH-1", profesorId: "PROF-1", diaSemana: DIAS_SEMANA.VIERNES, horaInicio: "08:00", horaFin: "08:45" },
      repo,
      asignacionRepo
    );

    expect(resultado.ok).toBe(true);
  });

  it("no se bloquea a sí mismo al mover dentro del mismo día/hora (excluye el propio bloque de la comprobación)", async () => {
    const asignacionRepo = new FakeAsignacionRepositorio([crearAsignacion({ id: "AS-1", profesorId: "PROF-1", periodoId: "PER-1" })]);
    const repo = new FakeBloqueHorarioRepositorio([
      crearBloqueHorario({ id: "BLH-1", asignacionId: "AS-1", profesorId: "PROF-1", diaSemana: DIAS_SEMANA.LUNES, horaInicio: "08:00", horaFin: "08:45" }),
    ]);

    const resultado = await moverBloqueHorario(
      { id: "BLH-1", profesorId: "PROF-1", diaSemana: DIAS_SEMANA.LUNES, horaInicio: "08:00", horaFin: "08:45" },
      repo,
      asignacionRepo
    );

    expect(resultado.ok).toBe(true);
  });

  it("mueve el bloque a un día y horario libres", async () => {
    const asignacionRepo = new FakeAsignacionRepositorio([crearAsignacion({ id: "AS-1", profesorId: "PROF-1", periodoId: "PER-1" })]);
    const repo = new FakeBloqueHorarioRepositorio([
      crearBloqueHorario({ id: "BLH-1", asignacionId: "AS-1", profesorId: "PROF-1", diaSemana: DIAS_SEMANA.LUNES, horaInicio: "08:00", horaFin: "08:45" }),
    ]);

    const resultado = await moverBloqueHorario(
      { id: "BLH-1", profesorId: "PROF-1", diaSemana: DIAS_SEMANA.VIERNES, horaInicio: "10:30", horaFin: "11:15" },
      repo,
      asignacionRepo
    );

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value.diaSemana).toBe(DIAS_SEMANA.VIERNES);
      expect(resultado.value.horaInicio).toBe("10:30");
    }
    const actualizado = await repo.buscarPorId("BLH-1");
    expect(actualizado?.diaSemana).toBe(DIAS_SEMANA.VIERNES);
  });

  it("retorna error si el destino se superpone con otra clase (de otro profesor) en la misma sección", async () => {
    const asignacionRepo = new FakeAsignacionRepositorio([
      crearAsignacion({ id: "AS-1", profesorId: "PROF-1", seccionId: "SEC-1", periodoId: "PER-1" }),
      crearAsignacion({ id: "AS-OTRO-CURSO", profesorId: "PROF-OTRO", cursoId: "CUR-OTRO", seccionId: "SEC-1", periodoId: "PER-1" }),
    ]);
    const repo = new FakeBloqueHorarioRepositorio([
      crearBloqueHorario({ id: "BLH-1", asignacionId: "AS-1", profesorId: "PROF-1", diaSemana: DIAS_SEMANA.LUNES, horaInicio: "08:00", horaFin: "08:45" }),
      crearBloqueHorario({ id: "BLH-OTRA-CLASE", asignacionId: "AS-OTRO-CURSO", profesorId: "PROF-OTRO", diaSemana: DIAS_SEMANA.VIERNES, horaInicio: "10:30", horaFin: "11:15" }),
    ]);

    const resultado = await moverBloqueHorario(
      { id: "BLH-1", profesorId: "PROF-1", diaSemana: DIAS_SEMANA.VIERNES, horaInicio: "10:30", horaFin: "11:15" },
      repo,
      asignacionRepo
    );

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("SECCION_OCUPADA_EN_HORARIO");
  });
});
