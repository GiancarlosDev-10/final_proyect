import { describe, it, expect } from "vitest";
import { cerrarPeriodo } from "@/modulos/periodos/aplicacion/cerrar-periodo";
import { ESTADOS_PERIODO, ESTADOS_UNIDAD_DIDACTICA } from "@/config/constantes";
import {
  crearPeriodo,
  crearUnidadDidactica,
  FakePeriodoRepositorio,
  FakeUnidadDidacticaRepositorio,
} from "@/test/fixtures-notas";

describe("cerrarPeriodo", () => {
  it("retorna error si el periodo no existe", async () => {
    const periodoRepo = new FakePeriodoRepositorio([]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([]);

    const resultado = await cerrarPeriodo("PER-1", periodoRepo, unidadRepo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("PERIODO_NO_ENCONTRADO");
  });

  it("retorna error y no cierra si alguna unidad didáctica del periodo sigue abierta", async () => {
    const periodoRepo = new FakePeriodoRepositorio([crearPeriodo()]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([
      crearUnidadDidactica({ id: "UDI-1", estado: ESTADOS_UNIDAD_DIDACTICA.CERRADO }),
      crearUnidadDidactica({ id: "UDI-2", estado: ESTADOS_UNIDAD_DIDACTICA.ABIERTO }),
    ]);

    const resultado = await cerrarPeriodo("PER-1", periodoRepo, unidadRepo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("UNIDAD_DIDACTICA_ABIERTA");
    const periodo = await periodoRepo.buscarPorId("PER-1");
    expect(periodo?.estado).toBe(ESTADOS_PERIODO.ABIERTO);
  });

  it("cierra el periodo si todas sus unidades didácticas están cerradas", async () => {
    const periodoRepo = new FakePeriodoRepositorio([crearPeriodo()]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([
      crearUnidadDidactica({ id: "UDI-1", estado: ESTADOS_UNIDAD_DIDACTICA.CERRADO }),
      crearUnidadDidactica({ id: "UDI-2", estado: ESTADOS_UNIDAD_DIDACTICA.CERRADO }),
    ]);

    const resultado = await cerrarPeriodo("PER-1", periodoRepo, unidadRepo);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.value.estado).toBe(ESTADOS_PERIODO.CERRADO);
  });

  it("cierra el periodo si no tiene ninguna unidad didáctica (compatibilidad con periodos existentes)", async () => {
    const periodoRepo = new FakePeriodoRepositorio([crearPeriodo()]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([]);

    const resultado = await cerrarPeriodo("PER-1", periodoRepo, unidadRepo);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.value.estado).toBe(ESTADOS_PERIODO.CERRADO);
  });

  it("no bloquea el cierre por unidades abiertas de otros periodos", async () => {
    const periodoRepo = new FakePeriodoRepositorio([crearPeriodo()]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([
      crearUnidadDidactica({ id: "UDI-OTRO", periodoId: "PER-2", estado: ESTADOS_UNIDAD_DIDACTICA.ABIERTO }),
    ]);

    const resultado = await cerrarPeriodo("PER-1", periodoRepo, unidadRepo);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.value.estado).toBe(ESTADOS_PERIODO.CERRADO);
  });
});
