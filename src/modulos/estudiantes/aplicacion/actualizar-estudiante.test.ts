import { describe, it, expect } from "vitest";
import { actualizarEstudiante } from "@/modulos/estudiantes/aplicacion/actualizar-estudiante";
import { crearEstudiante as crearEstudianteFixture, FakeEstudianteRepositorio } from "@/test/fixtures-notas";

const APODERADO = { nombre: "José Flores", telefono: "999999999", parentesco: "Padre", email: "jose.flores@ejemplo.com" };

describe("actualizarEstudiante", () => {
  it("retorna error si el estudiante no existe", async () => {
    const repo = new FakeEstudianteRepositorio([]);

    const resultado = await actualizarEstudiante(
      { id: "EST-NOPE", documento: "71000001", nombreCompleto: "X", fechaNacimiento: "2013-05-10", apoderado: APODERADO, activo: true },
      repo
    );

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("ESTUDIANTE_NO_ENCONTRADO");
  });

  it("retorna error amigable si el nuevo documento ya lo usa OTRO estudiante", async () => {
    const repo = new FakeEstudianteRepositorio([
      crearEstudianteFixture({ id: "EST-1", documento: "71000001" }),
      crearEstudianteFixture({ id: "EST-2", documento: "71000002" }),
    ]);

    const resultado = await actualizarEstudiante(
      { id: "EST-1", documento: "71000002", nombreCompleto: "Camila Flores Huamán", fechaNacimiento: "2013-05-10", apoderado: APODERADO, activo: true },
      repo
    );

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("DOCUMENTO_DUPLICADO");
  });

  it("no se bloquea a sí mismo cuando el documento no cambia", async () => {
    const repo = new FakeEstudianteRepositorio([crearEstudianteFixture({ id: "EST-1", documento: "71000001" })]);

    const resultado = await actualizarEstudiante(
      { id: "EST-1", documento: "71000001", nombreCompleto: "Camila Flores Huamán (editado)", fechaNacimiento: "2013-05-10", apoderado: APODERADO, activo: true },
      repo
    );

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.value.nombreCompleto).toBe("Camila Flores Huamán (editado)");
  });

  it("actualiza correctamente cuando el nuevo documento está libre", async () => {
    const repo = new FakeEstudianteRepositorio([crearEstudianteFixture({ id: "EST-1", documento: "71000001" })]);

    const resultado = await actualizarEstudiante(
      { id: "EST-1", documento: "71000099", nombreCompleto: "Camila Flores Huamán", fechaNacimiento: "2013-05-10", apoderado: APODERADO, activo: true },
      repo
    );

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.value.documento).toBe("71000099");
  });
});
