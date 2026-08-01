import { describe, it, expect } from "vitest";
import { crearEstudianteEnSeccion } from "@/modulos/estudiantes/aplicacion/crear-estudiante-en-seccion";
import { Matricula, MatriculaDuplicadaError } from "@/modulos/matriculas/dominio/matricula";
import { IMatriculaRepositorio } from "@/modulos/matriculas/aplicacion/i-matricula-repositorio";
import { FakeEstudianteRepositorio } from "@/test/fixtures-notas";

const DATOS_BASE = {
  documento: "71000001",
  nombreCompleto: "Camila Flores Huamán",
  fechaNacimiento: "2013-05-10",
  apoderado: { nombre: "José Flores", telefono: "999999999", parentesco: "Padre", email: "jose.flores@ejemplo.com" },
  seccionId: "SEC-1",
  anio: 2026,
};

/** Simula el paso de matrícula fallando siempre, sin importar el estudianteId generado. */
class FakeMatriculaRepositorioQueSiempreFalla implements IMatriculaRepositorio {
  async buscarPorId(): Promise<Matricula | null> {
    return null;
  }
  async buscarPorEstudianteYAnio(): Promise<Matricula | null> {
    return {} as Matricula; // cualquier valor truthy fuerza MatriculaDuplicadaError
  }
  async listar(): Promise<Matricula[]> {
    return [];
  }
  async listarPorSeccion(): Promise<Matricula[]> {
    return [];
  }
  async listarPorSecciones(): Promise<Matricula[]> {
    return [];
  }
  async crear(): Promise<void> {}
  async actualizar(): Promise<void> {}
  async eliminar(): Promise<void> {}
  async eliminarPorEstudiante(): Promise<void> {}
}

describe("crearEstudianteEnSeccion", () => {
  it("si falla crear la matrícula, deshace (elimina) el estudiante recién creado en vez de dejarlo huérfano", async () => {
    const estudianteRepo = new FakeEstudianteRepositorio([]);
    const matriculaRepo = new FakeMatriculaRepositorioQueSiempreFalla();

    const resultado = await crearEstudianteEnSeccion(DATOS_BASE, { estudianteRepo, matriculaRepo });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error).toBeInstanceOf(MatriculaDuplicadaError);
    // El estudiante no debe quedar persistido tras el rollback.
    expect(await estudianteRepo.listar()).toHaveLength(0);
  });

  it("crea el estudiante y su matrícula correctamente cuando todo sale bien", async () => {
    const estudianteRepo = new FakeEstudianteRepositorio([]);
    const matriculaRepo = new (class implements IMatriculaRepositorio {
      matriculas: Matricula[] = [];
      async buscarPorId() {
        return null;
      }
      async buscarPorEstudianteYAnio() {
        return null;
      }
      async listar() {
        return this.matriculas;
      }
      async listarPorSeccion() {
        return this.matriculas;
      }
      async listarPorSecciones() {
        return this.matriculas;
      }
      async crear(m: Matricula) {
        this.matriculas.push(m);
      }
      async actualizar() {}
      async eliminar() {}
      async eliminarPorEstudiante() {}
    })();

    const resultado = await crearEstudianteEnSeccion(DATOS_BASE, { estudianteRepo, matriculaRepo });

    expect(resultado.ok).toBe(true);
    expect(await estudianteRepo.listar()).toHaveLength(1);
    expect(matriculaRepo.matriculas).toHaveLength(1);
  });
});
