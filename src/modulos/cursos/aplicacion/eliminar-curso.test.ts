import { describe, it, expect } from "vitest";
import { eliminarCurso } from "@/modulos/cursos/aplicacion/eliminar-curso";
import { CursoNoEncontradoError, CursoEnUsoError } from "@/modulos/cursos/dominio/curso";
import {
  crearCurso,
  crearAsignacion,
  crearUnidadDidactica,
  FakeCursoRepositorio,
  FakeAsignacionRepositorio,
  FakeUnidadDidacticaRepositorio,
} from "@/test/fixtures-notas";

describe("eliminarCurso", () => {
  it("elimina el curso cuando no tiene unidades didácticas ni asignaciones", async () => {
    const curso = crearCurso({ id: "CUR-1" });
    const cursoRepo = new FakeCursoRepositorio([curso]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([]);
    const asignacionRepo = new FakeAsignacionRepositorio([]);

    const resultado = await eliminarCurso("CUR-1", cursoRepo, unidadRepo, asignacionRepo);

    expect(resultado.ok).toBe(true);
    expect(await cursoRepo.buscarPorId("CUR-1")).toBeNull();
  });

  it("falla si el curso no existe", async () => {
    const cursoRepo = new FakeCursoRepositorio([]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([]);
    const asignacionRepo = new FakeAsignacionRepositorio([]);

    const resultado = await eliminarCurso("CUR-X", cursoRepo, unidadRepo, asignacionRepo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error).toBeInstanceOf(CursoNoEncontradoError);
  });

  it("bloquea el borrado si el curso tiene una Unidad Didáctica registrada", async () => {
    const curso = crearCurso({ id: "CUR-1" });
    const unidad = crearUnidadDidactica({ id: "UD-1", cursoId: "CUR-1" });
    const cursoRepo = new FakeCursoRepositorio([curso]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([unidad]);
    const asignacionRepo = new FakeAsignacionRepositorio([]);

    const resultado = await eliminarCurso("CUR-1", cursoRepo, unidadRepo, asignacionRepo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error).toBeInstanceOf(CursoEnUsoError);
    // El curso no debe haberse tocado.
    expect(await cursoRepo.buscarPorId("CUR-1")).not.toBeNull();
  });

  it("bloquea el borrado si el curso tiene una Asignación registrada", async () => {
    const curso = crearCurso({ id: "CUR-1" });
    const asignacion = crearAsignacion({ id: "AS-1", cursoId: "CUR-1" });
    const cursoRepo = new FakeCursoRepositorio([curso]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([]);
    const asignacionRepo = new FakeAsignacionRepositorio([asignacion]);

    const resultado = await eliminarCurso("CUR-1", cursoRepo, unidadRepo, asignacionRepo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error).toBeInstanceOf(CursoEnUsoError);
  });

  it("no se confunde con unidades/asignaciones de OTRO curso", async () => {
    const curso = crearCurso({ id: "CUR-1" });
    const unidadOtroCurso = crearUnidadDidactica({ id: "UD-1", cursoId: "CUR-2" });
    const asignacionOtroCurso = crearAsignacion({ id: "AS-1", cursoId: "CUR-2" });
    const cursoRepo = new FakeCursoRepositorio([curso]);
    const unidadRepo = new FakeUnidadDidacticaRepositorio([unidadOtroCurso]);
    const asignacionRepo = new FakeAsignacionRepositorio([asignacionOtroCurso]);

    const resultado = await eliminarCurso("CUR-1", cursoRepo, unidadRepo, asignacionRepo);

    expect(resultado.ok).toBe(true);
  });
});
