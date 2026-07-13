import { describe, it, expect } from "vitest";
import { eliminarNota } from "@/modulos/notas/aplicacion/eliminar-nota";
import { ESTADOS_UNIDAD_DIDACTICA } from "@/config/constantes";
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
  profesorId: "PROF-1",
  cursoId: "CUR-1",
  seccionId: "SEC-1",
  unidadDidacticaId: "UDI-1",
};

describe("eliminarNota", () => {
  it("retorna error si la nota no existe", async () => {
    const notaRepo = new FakeNotaRepositorio([]);
    const asignacionRepo = new FakeAsignacionRepositorio([crearAsignacion()]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([crearUnidadDidactica()]);

    const resultado = await eliminarNota(DATOS_BASE, notaRepo, asignacionRepo, unidadRepo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("NOTA_NO_ENCONTRADA");
  });

  it("retorna error si la unidad didáctica no existe", async () => {
    const notaRepo = new FakeNotaRepositorio([crearNota()]);
    const asignacionRepo = new FakeAsignacionRepositorio([crearAsignacion()]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([]);

    const resultado = await eliminarNota(DATOS_BASE, notaRepo, asignacionRepo, unidadRepo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("UNIDAD_DIDACTICA_NO_ENCONTRADA");
    expect(notaRepo.todas()).toHaveLength(1);
  });

  it("retorna error si no hay asignación activa", async () => {
    const notaRepo = new FakeNotaRepositorio([crearNota()]);
    const asignacionRepo = new FakeAsignacionRepositorio([]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([crearUnidadDidactica()]);

    const resultado = await eliminarNota(DATOS_BASE, notaRepo, asignacionRepo, unidadRepo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("ASIGNACION_INACTIVA");
    expect(notaRepo.todas()).toHaveLength(1);
  });

  it("retorna error si la nota no pertenece a la asignación", async () => {
    const notaRepo = new FakeNotaRepositorio([crearNota({ asignacionId: "AS-OTRA" })]);
    const asignacionRepo = new FakeAsignacionRepositorio([crearAsignacion()]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([crearUnidadDidactica()]);

    const resultado = await eliminarNota(DATOS_BASE, notaRepo, asignacionRepo, unidadRepo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("NOTA_NO_PERTENECE_A_ASIGNACION");
    expect(notaRepo.todas()).toHaveLength(1);
  });

  it("retorna error si la unidad didáctica está cerrada", async () => {
    const notaRepo = new FakeNotaRepositorio([crearNota()]);
    const asignacionRepo = new FakeAsignacionRepositorio([crearAsignacion()]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([
      crearUnidadDidactica({ estado: ESTADOS_UNIDAD_DIDACTICA.CERRADO }),
    ]);

    const resultado = await eliminarNota(DATOS_BASE, notaRepo, asignacionRepo, unidadRepo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("UNIDAD_DIDACTICA_CERRADA");
    expect(notaRepo.todas()).toHaveLength(1);
  });

  it("elimina la nota si la asignación está activa y la unidad está abierta", async () => {
    const notaRepo = new FakeNotaRepositorio([crearNota()]);
    const asignacionRepo = new FakeAsignacionRepositorio([crearAsignacion()]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([crearUnidadDidactica()]);

    const resultado = await eliminarNota(DATOS_BASE, notaRepo, asignacionRepo, unidadRepo);

    expect(resultado.ok).toBe(true);
    expect(notaRepo.todas()).toHaveLength(0);
  });

  it("permite eliminar una nota antigua sin unidadDidacticaId bajo una unidad abierta", async () => {
    const notaRepo = new FakeNotaRepositorio([crearNota({ unidadDidacticaId: undefined })]);
    const asignacionRepo = new FakeAsignacionRepositorio([crearAsignacion()]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([crearUnidadDidactica()]);

    const resultado = await eliminarNota(DATOS_BASE, notaRepo, asignacionRepo, unidadRepo);

    expect(resultado.ok).toBe(true);
    expect(notaRepo.todas()).toHaveLength(0);
  });
});
