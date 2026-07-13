import { describe, it, expect } from "vitest";
import { actualizarRecordatorio } from "@/modulos/recordatorios/aplicacion/actualizar-recordatorio";
import { TIPOS_RECORDATORIO } from "@/config/constantes";
import { crearRecordatorio, FakeRecordatorioRepositorio } from "@/test/fixtures-notas";

describe("actualizarRecordatorio", () => {
  it("retorna error si el recordatorio no existe o pertenece a otro profesor", async () => {
    const repo = new FakeRecordatorioRepositorio([crearRecordatorio({ id: "REC-1", profesorId: "PROF-OTRO" })]);

    const resultado = await actualizarRecordatorio(
      { id: "REC-1", profesorId: "PROF-1", fecha: "2026-07-14", titulo: "Nuevo título", tipo: TIPOS_RECORDATORIO.OTRO },
      repo
    );

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("RECORDATORIO_NO_ENCONTRADO");
  });

  it("preserva horaInicio/horaFin existentes aunque el formulario de edición no los envíe", async () => {
    const repo = new FakeRecordatorioRepositorio([
      crearRecordatorio({ id: "REC-1", profesorId: "PROF-1", horaInicio: "08:00", horaFin: "08:45" }),
    ]);

    const resultado = await actualizarRecordatorio(
      { id: "REC-1", profesorId: "PROF-1", fecha: "2026-07-14", titulo: "Título editado", tipo: TIPOS_RECORDATORIO.REUNION_PROFESOR },
      repo
    );

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value.titulo).toBe("Título editado");
      expect(resultado.value.horaInicio).toBe("08:00");
      expect(resultado.value.horaFin).toBe("08:45");
    }
  });

  it("mantiene sin hora asignada un recordatorio que nunca tuvo hora", async () => {
    const repo = new FakeRecordatorioRepositorio([crearRecordatorio({ id: "REC-1", profesorId: "PROF-1" })]);

    const resultado = await actualizarRecordatorio(
      { id: "REC-1", profesorId: "PROF-1", fecha: "2026-07-14", titulo: "Título editado", tipo: TIPOS_RECORDATORIO.OTRO },
      repo
    );

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.value.tieneHoraAsignada()).toBe(false);
  });
});
