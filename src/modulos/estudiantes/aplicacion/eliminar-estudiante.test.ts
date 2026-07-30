import { describe, it, expect } from "vitest";
import { eliminarEstudiante } from "@/modulos/estudiantes/aplicacion/eliminar-estudiante";
import {
  crearEstudiante,
  FakeEstudianteRepositorio,
  crearMatricula,
  FakeMatriculaRepositorio,
  crearNota,
  FakeNotaRepositorio,
  crearRegistroAsistencia,
  FakeRegistroAsistenciaRepositorio,
  crearApoderadoVinculado,
  FakeApoderadoVinculadoRepositorio,
} from "@/test/fixtures-notas";

describe("eliminarEstudiante", () => {
  it("borra al estudiante y todo lo que depende de su id (matrículas, notas, asistencia, vínculo de Telegram)", async () => {
    const estudianteRepo = new FakeEstudianteRepositorio([crearEstudiante({ id: "EST-1" })]);
    const matriculaRepo = new FakeMatriculaRepositorio([
      crearMatricula({ id: "MAT-1", estudianteId: "EST-1" }),
      crearMatricula({ id: "MAT-2", estudianteId: "EST-OTRO" }),
    ]);
    const notaRepo = new FakeNotaRepositorio([
      crearNota({ id: "NOT-1", estudianteId: "EST-1" }),
      crearNota({ id: "NOT-2", estudianteId: "EST-OTRO" }),
    ]);
    const registroAsistenciaRepo = new FakeRegistroAsistenciaRepositorio([
      crearRegistroAsistencia({ id: "REG-1", estudianteId: "EST-1" }),
      crearRegistroAsistencia({ id: "REG-2", estudianteId: "EST-OTRO" }),
    ]);
    const apoderadoVinculadoRepo = new FakeApoderadoVinculadoRepositorio([
      crearApoderadoVinculado({ id: "APOD-1", estudianteId: "EST-1" }),
      crearApoderadoVinculado({ id: "APOD-2", estudianteId: "EST-OTRO" }),
    ]);

    const resultado = await eliminarEstudiante("EST-1", {
      estudianteRepo,
      matriculaRepo,
      notaRepo,
      registroAsistenciaRepo,
      apoderadoVinculadoRepo,
    });

    expect(resultado.ok).toBe(true);
    expect(await estudianteRepo.buscarPorId("EST-1")).toBeNull();
    expect(await matriculaRepo.buscarPorEstudianteYAnio("EST-1", 2026)).toBeNull();
    expect((await notaRepo.listarPorEstudiante("EST-1")).length).toBe(0);
    expect((await registroAsistenciaRepo.listarPorSesion("SES-1")).some((r) => r.estudianteId === "EST-1")).toBe(false);
    expect(await apoderadoVinculadoRepo.listarPorEstudianteId("EST-1")).toEqual([]);

    // No debe tocar los datos de otros estudiantes.
    expect(await matriculaRepo.buscarPorEstudianteYAnio("EST-OTRO", 2026)).not.toBeNull();
    expect((await notaRepo.listarPorEstudiante("EST-OTRO")).length).toBe(1);
    expect(await apoderadoVinculadoRepo.listarPorEstudianteId("EST-OTRO")).toHaveLength(1);
  });

  it("rechaza si el estudiante no existe, sin tocar nada", async () => {
    const estudianteRepo = new FakeEstudianteRepositorio([]);
    const matriculaRepo = new FakeMatriculaRepositorio([crearMatricula({ id: "MAT-1", estudianteId: "EST-OTRO" })]);

    const resultado = await eliminarEstudiante("EST-NOPE", {
      estudianteRepo,
      matriculaRepo,
      notaRepo: new FakeNotaRepositorio([]),
      registroAsistenciaRepo: new FakeRegistroAsistenciaRepositorio([]),
      apoderadoVinculadoRepo: new FakeApoderadoVinculadoRepositorio([]),
    });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("ESTUDIANTE_NO_ENCONTRADO");
    expect(await matriculaRepo.buscarPorId("MAT-1")).not.toBeNull();
  });
});
