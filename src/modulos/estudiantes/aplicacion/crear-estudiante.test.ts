import { describe, it, expect } from "vitest";
import { crearEstudiante } from "@/modulos/estudiantes/aplicacion/crear-estudiante";
import { crearEstudiante as crearEstudianteFixture, FakeEstudianteRepositorio } from "@/test/fixtures-notas";

const DATOS_BASE = {
  documento: "71000001",
  nombreCompleto: "Camila Flores Huamán",
  fechaNacimiento: "2013-05-10",
  apoderado: { nombre: "José Flores", telefono: "999999999", parentesco: "Padre", email: "jose.flores@ejemplo.com" },
};

describe("crearEstudiante", () => {
  it("retorna error amigable si ya existe un estudiante con ese documento (en vez del error crudo de Mongo)", async () => {
    const repo = new FakeEstudianteRepositorio([crearEstudianteFixture({ id: "EST-EXISTENTE", documento: "71000001" })]);

    const resultado = await crearEstudiante(DATOS_BASE, repo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("DOCUMENTO_DUPLICADO");
  });

  it("crea el estudiante cuando el documento no está en uso", async () => {
    const repo = new FakeEstudianteRepositorio([]);

    const resultado = await crearEstudiante(DATOS_BASE, repo);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.value.documento).toBe("71000001");
  });
});
