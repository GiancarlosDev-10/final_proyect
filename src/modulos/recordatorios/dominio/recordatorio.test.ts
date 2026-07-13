import { describe, it, expect } from "vitest";
import { Recordatorio, RangoHorarioRecordatorioInvalidoError } from "@/modulos/recordatorios/dominio/recordatorio";
import { TIPOS_RECORDATORIO } from "@/config/constantes";
import { crearRecordatorio } from "@/test/fixtures-notas";

describe("Recordatorio", () => {
  it("lanza RangoHorarioRecordatorioInvalidoError si horaInicio no es anterior a horaFin", () => {
    expect(() =>
      new Recordatorio({
        id: "REC-1",
        profesorId: "PROF-1",
        fecha: "2026-07-13",
        titulo: "Reunión",
        tipo: TIPOS_RECORDATORIO.OTRO,
        horaInicio: "09:00",
        horaFin: "09:00",
        creadoEn: "2026-01-01T00:00:00.000Z",
        actualizadoEn: "2026-01-01T00:00:00.000Z",
      })
    ).toThrow(RangoHorarioRecordatorioInvalidoError);
  });

  it("permite crear un recordatorio sin hora asignada", () => {
    const recordatorio = crearRecordatorio({ horaInicio: undefined, horaFin: undefined });
    expect(recordatorio.tieneHoraAsignada()).toBe(false);
  });

  it("tieneHoraAsignada() es true solo si ambos horaInicio y horaFin están presentes", () => {
    const recordatorio = crearRecordatorio({ horaInicio: "08:00", horaFin: "08:45" });
    expect(recordatorio.tieneHoraAsignada()).toBe(true);
  });
});
