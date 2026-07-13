import { describe, it, expect } from "vitest";
import { buscarAlumnoTelegram } from "@/modulos/telegram/aplicacion/buscar-alumno-telegram";
import {
  crearTelegramChat,
  FakeTelegramChatRepositorio,
  crearAsignacion,
  FakeAsignacionRepositorio,
  crearMatricula,
  FakeMatriculaRepositorio,
  crearEstudiante,
  FakeEstudianteRepositorio,
  crearSeccion,
  FakeSeccionRepositorio,
} from "@/test/fixtures-notas";

function reposCon({ chat, asignaciones = [], matriculas = [], estudiantes = [], secciones = [] }: any) {
  return {
    chatRepo: new FakeTelegramChatRepositorio(chat ? [chat] : []),
    asignacionRepo: new FakeAsignacionRepositorio(asignaciones),
    matriculaRepo: new FakeMatriculaRepositorio(matriculas),
    estudianteRepo: new FakeEstudianteRepositorio(estudiantes),
    seccionRepo: new FakeSeccionRepositorio(secciones),
  };
}

describe("buscarAlumnoTelegram", () => {
  it("retorna error si el chat no está vinculado", async () => {
    const repos = reposCon({});
    const resultado = await buscarAlumnoTelegram("CHAT-1", "Camila", repos);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("TELEGRAM_CHAT_NO_ENCONTRADO");
  });

  it("encuentra un alumno por coincidencia parcial de nombre, sin distinguir tildes", async () => {
    const repos = reposCon({
      chat: crearTelegramChat({ profesorId: "PROF-1" }),
      asignaciones: [crearAsignacion({ profesorId: "PROF-1", seccionId: "SEC-1" })],
      matriculas: [crearMatricula({ estudianteId: "EST-1", seccionId: "SEC-1" })],
      estudiantes: [crearEstudiante({ id: "EST-1", nombreCompleto: "Camila Flores Huamán" })],
      secciones: [crearSeccion({ id: "SEC-1", grado: "1°", nombre: "A" })],
    });

    const resultado = await buscarAlumnoTelegram("CHAT-1", "flores huaman", repos);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value).toHaveLength(1);
      expect(resultado.value[0].estudianteId).toBe("EST-1");
      expect(resultado.value[0].seccion).toBe("1° A");
    }
  });

  it("devuelve varios candidatos cuando el nombre es ambiguo", async () => {
    const repos = reposCon({
      chat: crearTelegramChat({ profesorId: "PROF-1" }),
      asignaciones: [crearAsignacion({ profesorId: "PROF-1", seccionId: "SEC-1" })],
      matriculas: [
        crearMatricula({ id: "MAT-1", estudianteId: "EST-1", seccionId: "SEC-1" }),
        crearMatricula({ id: "MAT-2", estudianteId: "EST-2", seccionId: "SEC-1" }),
      ],
      estudiantes: [
        crearEstudiante({ id: "EST-1", nombreCompleto: "Camila Flores Huamán" }),
        crearEstudiante({ id: "EST-2", nombreCompleto: "Camila Flores Rojas" }),
      ],
      secciones: [crearSeccion({ id: "SEC-1" })],
    });

    const resultado = await buscarAlumnoTelegram("CHAT-1", "Camila Flores", repos);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.value).toHaveLength(2);
  });

  it("nunca devuelve alumnos de secciones donde el profesor no dicta", async () => {
    const repos = reposCon({
      chat: crearTelegramChat({ profesorId: "PROF-1" }),
      asignaciones: [crearAsignacion({ profesorId: "PROF-1", seccionId: "SEC-1" })],
      matriculas: [crearMatricula({ estudianteId: "EST-2", seccionId: "SEC-OTRA" })],
      estudiantes: [crearEstudiante({ id: "EST-2", nombreCompleto: "Camila Flores" })],
      secciones: [crearSeccion({ id: "SEC-1" }), crearSeccion({ id: "SEC-OTRA" })],
    });

    const resultado = await buscarAlumnoTelegram("CHAT-1", "Camila", repos);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.value).toHaveLength(0);
  });

  it("ignora matrículas inactivas y estudiantes inactivos", async () => {
    const repos = reposCon({
      chat: crearTelegramChat({ profesorId: "PROF-1" }),
      asignaciones: [crearAsignacion({ profesorId: "PROF-1", seccionId: "SEC-1" })],
      matriculas: [
        crearMatricula({ id: "MAT-1", estudianteId: "EST-1", seccionId: "SEC-1", activo: false }),
        crearMatricula({ id: "MAT-2", estudianteId: "EST-2", seccionId: "SEC-1" }),
      ],
      estudiantes: [
        crearEstudiante({ id: "EST-1", nombreCompleto: "Camila Baja" }),
        crearEstudiante({ id: "EST-2", nombreCompleto: "Camila Inactiva", activo: false }),
      ],
      secciones: [crearSeccion({ id: "SEC-1" })],
    });

    const resultado = await buscarAlumnoTelegram("CHAT-1", "Camila", repos);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.value).toHaveLength(0);
  });
});
