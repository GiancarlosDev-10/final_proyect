import { describe, it, expect } from "vitest";
import { BloqueHorario, RangoHorarioInvalidoError } from "@/modulos/horarios/dominio/bloque-horario";
import { DIAS_SEMANA } from "@/config/constantes";
import { crearBloqueHorario } from "@/test/fixtures-notas";

describe("BloqueHorario", () => {
  it("lanza RangoHorarioInvalidoError si horaInicio no es anterior a horaFin", () => {
    expect(() =>
      new BloqueHorario({
        id: "BLH-1",
        asignacionId: "AS-1",
        profesorId: "PROF-1",
        diaSemana: DIAS_SEMANA.LUNES,
        horaInicio: "09:00",
        horaFin: "09:00",
        creadoEn: "2026-01-01T00:00:00.000Z",
        actualizadoEn: "2026-01-01T00:00:00.000Z",
      })
    ).toThrow(RangoHorarioInvalidoError);
  });

  it("seSuperponeCon detecta cruce de horarios en el mismo día", () => {
    const bloque = crearBloqueHorario({ diaSemana: DIAS_SEMANA.LUNES, horaInicio: "08:00", horaFin: "08:45" });

    expect(bloque.seSuperponeCon(DIAS_SEMANA.LUNES, "08:15", "09:00")).toBe(true); // se cruza
    expect(bloque.seSuperponeCon(DIAS_SEMANA.LUNES, "08:45", "09:30")).toBe(false); // contiguo, no se cruza
    expect(bloque.seSuperponeCon(DIAS_SEMANA.MARTES, "08:00", "08:45")).toBe(false); // mismo horario, otro día
  });
});
