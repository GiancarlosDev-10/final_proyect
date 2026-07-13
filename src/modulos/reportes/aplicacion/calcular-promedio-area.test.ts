import { describe, it, expect } from "vitest";
import { calcularPromedioArea } from "@/modulos/reportes/aplicacion/calcular-promedio-area";
import {
  crearAsignacion,
  crearCurso,
  crearNota,
  crearUnidadDidactica,
  FakeAsignacionRepositorio,
  FakeCursoRepositorio,
  FakeNotaRepositorio,
  FakeUnidadDidacticaRepositorio,
} from "@/test/fixtures-notas";

const DATOS_BASE = { estudianteId: "EST-1", areaId: "ARE-1", periodoId: "PER-1" };

describe("calcularPromedioArea", () => {
  it("agrega el promedio de todos los cursos del área, ignorando cursos de otras áreas", async () => {
    const cursoRepo = new FakeCursoRepositorio([
      crearCurso({ id: "CUR-1", nombre: "Álgebra", areaId: "ARE-1" }),
      crearCurso({ id: "CUR-2", nombre: "Aritmética", areaId: "ARE-1" }),
      crearCurso({ id: "CUR-3", nombre: "Comunicación", areaId: "ARE-OTRA" }),
    ]);
    const asignacionRepo = new FakeAsignacionRepositorio([
      crearAsignacion({ id: "AS-1", cursoId: "CUR-1", periodoId: "PER-1" }),
      crearAsignacion({ id: "AS-2", cursoId: "CUR-2", periodoId: "PER-1" }),
      crearAsignacion({ id: "AS-3", cursoId: "CUR-3", periodoId: "PER-1" }),
    ]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([
      crearUnidadDidactica({ id: "UDI-1", periodoId: "PER-1" }),
      crearUnidadDidactica({ id: "UDI-2", periodoId: "PER-1" }),
    ]);
    const notaRepo = new FakeNotaRepositorio([
      // Álgebra: Mes1=15, Mes2=18 -> bimestral 16.5
      crearNota({ id: "NOT-1", asignacionId: "AS-1", unidadDidacticaId: "UDI-1", valor: 14 }),
      crearNota({ id: "NOT-2", asignacionId: "AS-1", unidadDidacticaId: "UDI-1", valor: 16 }),
      crearNota({ id: "NOT-3", asignacionId: "AS-1", unidadDidacticaId: "UDI-2", valor: 18 }),
      // Aritmética: Mes1=10, sin nota en Mes2 -> bimestral 10
      crearNota({ id: "NOT-4", asignacionId: "AS-2", unidadDidacticaId: "UDI-1", valor: 10 }),
      // Comunicación (otra área): no debe afectar el resultado
      crearNota({ id: "NOT-RUIDO", asignacionId: "AS-3", unidadDidacticaId: "UDI-1", valor: 20 }),
    ]);

    const resultado = await calcularPromedioArea(DATOS_BASE, cursoRepo, notaRepo, asignacionRepo, unidadRepo);

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.value.cursos.map((c) => c.cursoId).sort()).toEqual(["CUR-1", "CUR-2"]);
    expect(resultado.value.promediosPorUnidad).toEqual([
      { unidadDidacticaId: "UDI-1", promedio: 12.5 }, // avg(15, 10)
      { unidadDidacticaId: "UDI-2", promedio: 18 }, // solo Álgebra tiene nota ahí
    ]);
    expect(resultado.value.promedioBimestral).toBe(15.25); // avg(12.5, 18)
  });

  it("retorna listas vacías y promedio null si el área no tiene cursos", async () => {
    const cursoRepo = new FakeCursoRepositorio([]);
    const asignacionRepo = new FakeAsignacionRepositorio([]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([crearUnidadDidactica({ id: "UDI-1", periodoId: "PER-1" })]);
    const notaRepo = new FakeNotaRepositorio([]);

    const resultado = await calcularPromedioArea(DATOS_BASE, cursoRepo, notaRepo, asignacionRepo, unidadRepo);

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.value.cursos).toEqual([]);
    expect(resultado.value.promediosPorUnidad).toEqual([{ unidadDidacticaId: "UDI-1", promedio: null }]);
    expect(resultado.value.promedioBimestral).toBeNull();
  });
});
