import { describe, it, expect } from "vitest";
import { consultarNotasTelegram } from "@/modulos/telegram/aplicacion/consultar-notas-telegram";
import {
  crearTelegramChat,
  FakeTelegramChatRepositorio,
  crearAsignacion,
  FakeAsignacionRepositorio,
  crearMatricula,
  FakeMatriculaRepositorio,
  crearEstudiante,
  FakeEstudianteRepositorio,
  crearNota,
  FakeNotaRepositorio,
  crearCurso,
  FakeCursoRepositorio,
  crearPeriodo,
  FakePeriodoRepositorio,
} from "@/test/fixtures-notas";

function reposCon({ chat, asignaciones = [], matriculas = [], estudiantes = [], notas = [], cursos = [], periodos = [] }: any) {
  return {
    chatRepo: new FakeTelegramChatRepositorio(chat ? [chat] : []),
    asignacionRepo: new FakeAsignacionRepositorio(asignaciones),
    matriculaRepo: new FakeMatriculaRepositorio(matriculas),
    estudianteRepo: new FakeEstudianteRepositorio(estudiantes),
    notaRepo: new FakeNotaRepositorio(notas),
    cursoRepo: new FakeCursoRepositorio(cursos),
    periodoRepo: new FakePeriodoRepositorio(periodos),
  };
}

describe("consultarNotasTelegram", () => {
  it("retorna error si el chat no está vinculado", async () => {
    const repos = reposCon({});
    const resultado = await consultarNotasTelegram({ chatId: "CHAT-1", estudianteId: "EST-1" }, repos);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("TELEGRAM_CHAT_NO_ENCONTRADO");
  });

  it("rechaza consultar un alumno que no pertenece a las secciones del profesor", async () => {
    const repos = reposCon({
      chat: crearTelegramChat({ profesorId: "PROF-1" }),
      asignaciones: [crearAsignacion({ profesorId: "PROF-1", seccionId: "SEC-1" })],
      matriculas: [crearMatricula({ estudianteId: "EST-1", seccionId: "SEC-OTRA" })],
      estudiantes: [crearEstudiante({ id: "EST-1" })],
    });

    const resultado = await consultarNotasTelegram({ chatId: "CHAT-1", estudianteId: "EST-1" }, repos);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("ALUMNO_NO_ASIGNADO");
  });

  it("devuelve solo las notas de las asignaciones del profesor, con promedio correcto", async () => {
    const repos = reposCon({
      chat: crearTelegramChat({ profesorId: "PROF-1" }),
      asignaciones: [
        crearAsignacion({ id: "AS-MIA", profesorId: "PROF-1", seccionId: "SEC-1", cursoId: "CUR-1", periodoId: "PER-1" }),
      ],
      matriculas: [crearMatricula({ estudianteId: "EST-1", seccionId: "SEC-1" })],
      estudiantes: [crearEstudiante({ id: "EST-1", nombreCompleto: "Camila Flores" })],
      notas: [
        crearNota({ id: "NOT-1", estudianteId: "EST-1", asignacionId: "AS-MIA", periodoId: "PER-1", valor: 15 }),
        crearNota({ id: "NOT-2", estudianteId: "EST-1", asignacionId: "AS-MIA", periodoId: "PER-1", valor: 17 }),
        // Nota de otra asignación (otro profesor u otro curso): no debe filtrarse ni promediarse.
        crearNota({ id: "NOT-3", estudianteId: "EST-1", asignacionId: "AS-OTRO-PROFESOR", periodoId: "PER-1", valor: 5 }),
      ],
      cursos: [crearCurso({ id: "CUR-1", nombre: "Álgebra" })],
      periodos: [crearPeriodo({ id: "PER-1", nombre: "Bimestre 1" })],
    });

    const resultado = await consultarNotasTelegram({ chatId: "CHAT-1", estudianteId: "EST-1" }, repos);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value.notas).toHaveLength(2);
      expect(resultado.value.promedio).toBe(16);
      expect(resultado.value.notas[0].curso).toBe("Álgebra");
    }
  });

  it("filtra por nombre de curso cuando se especifica", async () => {
    const repos = reposCon({
      chat: crearTelegramChat({ profesorId: "PROF-1" }),
      asignaciones: [
        crearAsignacion({ id: "AS-MATE", profesorId: "PROF-1", seccionId: "SEC-1", cursoId: "CUR-MATE", periodoId: "PER-1" }),
        crearAsignacion({ id: "AS-COM", profesorId: "PROF-1", seccionId: "SEC-1", cursoId: "CUR-COM", periodoId: "PER-1" }),
      ],
      matriculas: [crearMatricula({ estudianteId: "EST-1", seccionId: "SEC-1" })],
      estudiantes: [crearEstudiante({ id: "EST-1" })],
      notas: [
        crearNota({ id: "NOT-1", estudianteId: "EST-1", asignacionId: "AS-MATE", periodoId: "PER-1", valor: 18 }),
        crearNota({ id: "NOT-2", estudianteId: "EST-1", asignacionId: "AS-COM", periodoId: "PER-1", valor: 10 }),
      ],
      cursos: [crearCurso({ id: "CUR-MATE", nombre: "Matemática" }), crearCurso({ id: "CUR-COM", nombre: "Comunicación" })],
      periodos: [crearPeriodo({ id: "PER-1", nombre: "Bimestre 1" })],
    });

    const resultado = await consultarNotasTelegram(
      { chatId: "CHAT-1", estudianteId: "EST-1", cursoNombre: "matematica" },
      repos
    );

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value.notas).toHaveLength(1);
      expect(resultado.value.notas[0].valor).toBe(18);
    }
  });

  it("retorna promedio null cuando el alumno no tiene notas registradas por este profesor", async () => {
    const repos = reposCon({
      chat: crearTelegramChat({ profesorId: "PROF-1" }),
      asignaciones: [crearAsignacion({ profesorId: "PROF-1", seccionId: "SEC-1" })],
      matriculas: [crearMatricula({ estudianteId: "EST-1", seccionId: "SEC-1" })],
      estudiantes: [crearEstudiante({ id: "EST-1" })],
    });

    const resultado = await consultarNotasTelegram({ chatId: "CHAT-1", estudianteId: "EST-1" }, repos);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value.notas).toHaveLength(0);
      expect(resultado.value.promedio).toBeNull();
    }
  });
});
