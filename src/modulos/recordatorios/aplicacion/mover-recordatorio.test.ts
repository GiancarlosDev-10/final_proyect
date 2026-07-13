import { describe, it, expect } from "vitest";
import { moverRecordatorio } from "@/modulos/recordatorios/aplicacion/mover-recordatorio";
import { crearRecordatorio, FakeRecordatorioRepositorio } from "@/test/fixtures-notas";

describe("moverRecordatorio", () => {
  it("retorna error si el recordatorio no existe o pertenece a otro profesor", async () => {
    const repo = new FakeRecordatorioRepositorio([crearRecordatorio({ id: "REC-1", profesorId: "PROF-OTRO" })]);

    const resultado = await moverRecordatorio(
      { id: "REC-1", profesorId: "PROF-1", fecha: "2026-07-14" },
      repo
    );

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("RECORDATORIO_NO_ENCONTRADO");
  });

  it("asigna hora y actualiza la fecha cuando se suelta en una casilla de hora", async () => {
    const repo = new FakeRecordatorioRepositorio([
      crearRecordatorio({ id: "REC-1", profesorId: "PROF-1", fecha: "2026-07-13" }),
    ]);

    const resultado = await moverRecordatorio(
      { id: "REC-1", profesorId: "PROF-1", fecha: "2026-07-15", horaInicio: "11:15", horaFin: "12:00" },
      repo
    );

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value.fecha).toBe("2026-07-15");
      expect(resultado.value.horaInicio).toBe("11:15");
      expect(resultado.value.tieneHoraAsignada()).toBe(true);
    }
  });

  it("quita la hora asignada cuando se suelta de vuelta en la fila de recordatorios", async () => {
    const repo = new FakeRecordatorioRepositorio([
      crearRecordatorio({ id: "REC-1", profesorId: "PROF-1", horaInicio: "08:00", horaFin: "08:45" }),
    ]);

    const resultado = await moverRecordatorio(
      { id: "REC-1", profesorId: "PROF-1", fecha: "2026-07-16" },
      repo
    );

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value.fecha).toBe("2026-07-16");
      expect(resultado.value.tieneHoraAsignada()).toBe(false);
    }
  });

  it("preserva título, descripción y tipo al mover", async () => {
    const repo = new FakeRecordatorioRepositorio([
      crearRecordatorio({ id: "REC-1", profesorId: "PROF-1", titulo: "Reunión importante", descripcion: "Llevar reporte" }),
    ]);

    const resultado = await moverRecordatorio(
      { id: "REC-1", profesorId: "PROF-1", fecha: "2026-07-17", horaInicio: "09:30", horaFin: "10:15" },
      repo
    );

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value.titulo).toBe("Reunión importante");
      expect(resultado.value.descripcion).toBe("Llevar reporte");
    }
  });
});
