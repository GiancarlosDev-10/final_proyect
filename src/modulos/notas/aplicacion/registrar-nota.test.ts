import { describe, it, expect } from "vitest";
import { registrarNota } from "@/modulos/notas/aplicacion/registrar-nota";
import { ESTADOS_UNIDAD_DIDACTICA, TIPOS_NOTA } from "@/config/constantes";
import {
  crearAsignacion,
  crearUnidadDidactica,
  FakeAsignacionRepositorio,
  FakeNotaRepositorio,
  FakeUnidadDidacticaRepositorio,
} from "@/test/fixtures-notas";

const DATOS_BASE = {
  estudianteId: "EST-1",
  asignacionId: "AS-1",
  unidadDidacticaId: "UDI-1",
  tipo: TIPOS_NOTA.PRACTICA,
  etiqueta: "Práctica 1",
  valor: 15,
  fecha: "2026-03-10",
  profesorId: "PROF-1",
  cursoId: "CUR-1",
  seccionId: "SEC-1",
};

describe("registrarNota", () => {
  it("retorna error si la unidad didáctica no existe", async () => {
    const notaRepo = new FakeNotaRepositorio();
    const asignacionRepo = new FakeAsignacionRepositorio([crearAsignacion()]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([]);

    const resultado = await registrarNota(DATOS_BASE, notaRepo, asignacionRepo, unidadRepo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("UNIDAD_DIDACTICA_NO_ENCONTRADA");
    expect(notaRepo.todas()).toHaveLength(0);
  });

  it("retorna error si no hay asignación activa para el periodo derivado de la unidad", async () => {
    const notaRepo = new FakeNotaRepositorio();
    const asignacionRepo = new FakeAsignacionRepositorio([]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([crearUnidadDidactica()]);

    const resultado = await registrarNota(DATOS_BASE, notaRepo, asignacionRepo, unidadRepo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("ASIGNACION_INACTIVA");
    expect(notaRepo.todas()).toHaveLength(0);
  });

  it("retorna error si la unidad pertenece a un periodo distinto al de la asignación", async () => {
    const notaRepo = new FakeNotaRepositorio();
    const asignacionRepo = new FakeAsignacionRepositorio([crearAsignacion({ periodoId: "PER-1" })]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([crearUnidadDidactica({ periodoId: "PER-2" })]);

    const resultado = await registrarNota(DATOS_BASE, notaRepo, asignacionRepo, unidadRepo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("ASIGNACION_INACTIVA");
    expect(notaRepo.todas()).toHaveLength(0);
  });

  it("retorna error si la unidad didáctica está cerrada", async () => {
    const notaRepo = new FakeNotaRepositorio();
    const asignacionRepo = new FakeAsignacionRepositorio([crearAsignacion()]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([
      crearUnidadDidactica({ estado: ESTADOS_UNIDAD_DIDACTICA.CERRADO }),
    ]);

    const resultado = await registrarNota(DATOS_BASE, notaRepo, asignacionRepo, unidadRepo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("UNIDAD_DIDACTICA_CERRADA");
    expect(notaRepo.todas()).toHaveLength(0);
  });

  it("retorna error (sin lanzar excepción) si el valor no es un número válido", async () => {
    const notaRepo = new FakeNotaRepositorio();
    const asignacionRepo = new FakeAsignacionRepositorio([crearAsignacion()]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([crearUnidadDidactica()]);

    const resultado = await registrarNota({ ...DATOS_BASE, valor: NaN }, notaRepo, asignacionRepo, unidadRepo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("NOTA_FUERA_DE_RANGO");
    expect(notaRepo.todas()).toHaveLength(0);
  });

  it("retorna error (sin lanzar excepción) si el valor está fuera del rango 0-20", async () => {
    const notaRepo = new FakeNotaRepositorio();
    const asignacionRepo = new FakeAsignacionRepositorio([crearAsignacion()]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([crearUnidadDidactica()]);

    const resultado = await registrarNota({ ...DATOS_BASE, valor: 25 }, notaRepo, asignacionRepo, unidadRepo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("NOTA_FUERA_DE_RANGO");
    expect(notaRepo.todas()).toHaveLength(0);
  });

  it("registra la nota con unidadDidacticaId y periodoId derivado si todo es válido", async () => {
    const notaRepo = new FakeNotaRepositorio();
    const asignacionRepo = new FakeAsignacionRepositorio([crearAsignacion()]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([crearUnidadDidactica()]);

    const resultado = await registrarNota(DATOS_BASE, notaRepo, asignacionRepo, unidadRepo);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value.valor).toBe(15);
      expect(resultado.value.unidadDidacticaId).toBe("UDI-1");
      expect(resultado.value.periodoId).toBe("PER-1");
    }
    expect(notaRepo.todas()).toHaveLength(1);
  });
});
