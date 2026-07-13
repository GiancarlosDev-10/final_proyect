import { describe, it, expect } from "vitest";
import { editarNota } from "@/modulos/notas/aplicacion/editar-nota";
import { ESTADOS_UNIDAD_DIDACTICA, TIPOS_NOTA } from "@/config/constantes";
import {
  crearAsignacion,
  crearNota,
  crearUnidadDidactica,
  FakeAsignacionRepositorio,
  FakeNotaRepositorio,
  FakeUnidadDidacticaRepositorio,
} from "@/test/fixtures-notas";

const DATOS_BASE = {
  id: "NOT-1",
  tipo: TIPOS_NOTA.EXAMEN,
  etiqueta: "Examen final",
  valor: 18,
  fecha: "2026-04-01",
  profesorId: "PROF-1",
  cursoId: "CUR-1",
  seccionId: "SEC-1",
  unidadDidacticaId: "UDI-1",
};

describe("editarNota", () => {
  it("retorna error si la nota no existe", async () => {
    const notaRepo = new FakeNotaRepositorio([]);
    const asignacionRepo = new FakeAsignacionRepositorio([crearAsignacion()]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([crearUnidadDidactica()]);

    const resultado = await editarNota(DATOS_BASE, notaRepo, asignacionRepo, unidadRepo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("NOTA_NO_ENCONTRADA");
  });

  it("retorna error si la unidad didáctica no existe", async () => {
    const notaRepo = new FakeNotaRepositorio([crearNota()]);
    const asignacionRepo = new FakeAsignacionRepositorio([crearAsignacion()]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([]);

    const resultado = await editarNota(DATOS_BASE, notaRepo, asignacionRepo, unidadRepo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("UNIDAD_DIDACTICA_NO_ENCONTRADA");
  });

  it("retorna error si no hay asignación activa", async () => {
    const notaRepo = new FakeNotaRepositorio([crearNota()]);
    const asignacionRepo = new FakeAsignacionRepositorio([]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([crearUnidadDidactica()]);

    const resultado = await editarNota(DATOS_BASE, notaRepo, asignacionRepo, unidadRepo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("ASIGNACION_INACTIVA");
  });

  it("retorna error si la nota no pertenece a la asignación", async () => {
    const notaRepo = new FakeNotaRepositorio([crearNota({ asignacionId: "AS-OTRA" })]);
    const asignacionRepo = new FakeAsignacionRepositorio([crearAsignacion()]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([crearUnidadDidactica()]);

    const resultado = await editarNota(DATOS_BASE, notaRepo, asignacionRepo, unidadRepo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("NOTA_NO_PERTENECE_A_ASIGNACION");
  });

  it("retorna error si la unidad didáctica está cerrada", async () => {
    const notaRepo = new FakeNotaRepositorio([crearNota()]);
    const asignacionRepo = new FakeAsignacionRepositorio([crearAsignacion()]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([
      crearUnidadDidactica({ estado: ESTADOS_UNIDAD_DIDACTICA.CERRADO }),
    ]);

    const resultado = await editarNota(DATOS_BASE, notaRepo, asignacionRepo, unidadRepo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("UNIDAD_DIDACTICA_CERRADA");
  });

  it("actualiza la nota y conserva su unidadDidacticaId y periodoId originales", async () => {
    const notaRepo = new FakeNotaRepositorio([crearNota({ unidadDidacticaId: "UDI-ORIGINAL" })]);
    const asignacionRepo = new FakeAsignacionRepositorio([crearAsignacion()]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([crearUnidadDidactica()]);

    const resultado = await editarNota(DATOS_BASE, notaRepo, asignacionRepo, unidadRepo);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value.valor).toBe(18);
      expect(resultado.value.unidadDidacticaId).toBe("UDI-ORIGINAL");
      expect(resultado.value.periodoId).toBe("PER-1");
    }
  });

  it("permite editar una nota antigua sin unidadDidacticaId bajo una unidad abierta", async () => {
    const notaRepo = new FakeNotaRepositorio([crearNota()]);
    const asignacionRepo = new FakeAsignacionRepositorio([crearAsignacion()]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([crearUnidadDidactica()]);

    const resultado = await editarNota(DATOS_BASE, notaRepo, asignacionRepo, unidadRepo);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value.valor).toBe(18);
      expect(resultado.value.unidadDidacticaId).toBeUndefined();
    }
  });
});
