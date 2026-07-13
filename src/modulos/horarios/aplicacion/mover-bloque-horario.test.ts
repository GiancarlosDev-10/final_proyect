import { describe, it, expect } from "vitest";
import { moverBloqueHorario } from "@/modulos/horarios/aplicacion/mover-bloque-horario";
import { DIAS_SEMANA } from "@/config/constantes";
import { crearBloqueHorario, FakeBloqueHorarioRepositorio } from "@/test/fixtures-notas";

describe("moverBloqueHorario", () => {
  it("retorna error si el bloque no existe o pertenece a otro profesor", async () => {
    const repo = new FakeBloqueHorarioRepositorio([crearBloqueHorario({ id: "BLH-1", profesorId: "PROF-OTRO" })]);

    const resultado = await moverBloqueHorario(
      { id: "BLH-1", profesorId: "PROF-1", diaSemana: DIAS_SEMANA.VIERNES, horaInicio: "08:00", horaFin: "08:45" },
      repo
    );

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("BLOQUE_HORARIO_NO_ENCONTRADO");
  });

  it("retorna error si el destino se superpone con otro bloque del mismo profesor", async () => {
    const repo = new FakeBloqueHorarioRepositorio([
      crearBloqueHorario({ id: "BLH-1", profesorId: "PROF-1", diaSemana: DIAS_SEMANA.LUNES, horaInicio: "08:00", horaFin: "08:45" }),
      crearBloqueHorario({ id: "BLH-2", profesorId: "PROF-1", diaSemana: DIAS_SEMANA.VIERNES, horaInicio: "08:00", horaFin: "08:45" }),
    ]);

    const resultado = await moverBloqueHorario(
      { id: "BLH-1", profesorId: "PROF-1", diaSemana: DIAS_SEMANA.VIERNES, horaInicio: "08:00", horaFin: "08:45" },
      repo
    );

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("BLOQUE_HORARIO_SUPERPUESTO");
  });

  it("no se bloquea a sí mismo al mover dentro del mismo día/hora (excluye el propio bloque de la comprobación)", async () => {
    const repo = new FakeBloqueHorarioRepositorio([
      crearBloqueHorario({ id: "BLH-1", profesorId: "PROF-1", diaSemana: DIAS_SEMANA.LUNES, horaInicio: "08:00", horaFin: "08:45" }),
    ]);

    const resultado = await moverBloqueHorario(
      { id: "BLH-1", profesorId: "PROF-1", diaSemana: DIAS_SEMANA.LUNES, horaInicio: "08:00", horaFin: "08:45" },
      repo
    );

    expect(resultado.ok).toBe(true);
  });

  it("mueve el bloque a un día y horario libres", async () => {
    const repo = new FakeBloqueHorarioRepositorio([
      crearBloqueHorario({ id: "BLH-1", profesorId: "PROF-1", diaSemana: DIAS_SEMANA.LUNES, horaInicio: "08:00", horaFin: "08:45" }),
    ]);

    const resultado = await moverBloqueHorario(
      { id: "BLH-1", profesorId: "PROF-1", diaSemana: DIAS_SEMANA.VIERNES, horaInicio: "10:30", horaFin: "11:15" },
      repo
    );

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value.diaSemana).toBe(DIAS_SEMANA.VIERNES);
      expect(resultado.value.horaInicio).toBe("10:30");
    }
    const actualizado = await repo.buscarPorId("BLH-1");
    expect(actualizado?.diaSemana).toBe(DIAS_SEMANA.VIERNES);
  });
});
