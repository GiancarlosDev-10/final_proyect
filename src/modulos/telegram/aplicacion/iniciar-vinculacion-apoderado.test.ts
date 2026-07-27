import { describe, it, expect } from "vitest";
import { iniciarVinculacionApoderado } from "@/modulos/telegram/aplicacion/iniciar-vinculacion-apoderado";
import {
  crearEstudiante,
  FakeEstudianteRepositorio,
  FakeCodigoApoderadoRepositorio,
  FakeApoderadoIntentoRepositorio,
  crearApoderadoIntento,
} from "@/test/fixtures-notas";

describe("iniciarVinculacionApoderado", () => {
  it("genera un código de 6 dígitos cuando el DNI existe y tiene email de apoderado", async () => {
    const estudiante = crearEstudiante({ documento: "71000001" });
    const estudianteRepo = new FakeEstudianteRepositorio([estudiante]);
    const codigoRepo = new FakeCodigoApoderadoRepositorio();
    const intentoRepo = new FakeApoderadoIntentoRepositorio();

    const resultado = await iniciarVinculacionApoderado(
      { chatId: "CHAT-1", dniEstudiante: "71000001" },
      { estudianteRepo, codigoRepo, intentoRepo }
    );

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value.nombreEstudiante).toBe(estudiante.nombreCompleto);
      expect(resultado.value.emailApoderado).toBe(estudiante.apoderado.email);
      expect(resultado.value.codigo).toMatch(/^\d{6}$/);
      expect(resultado.value.emailEnmascarado).toMatch(/^.\*\*\*@/);
    }
    const codigoGuardado = await codigoRepo.buscarPorChatId("CHAT-1");
    expect(codigoGuardado?.estudianteId).toBe(estudiante.id);
  });

  it("rechaza un DNI inexistente y registra el intento fallido", async () => {
    const estudianteRepo = new FakeEstudianteRepositorio([]);
    const codigoRepo = new FakeCodigoApoderadoRepositorio();
    const intentoRepo = new FakeApoderadoIntentoRepositorio();

    const resultado = await iniciarVinculacionApoderado(
      { chatId: "CHAT-1", dniEstudiante: "00000000" },
      { estudianteRepo, codigoRepo, intentoRepo }
    );

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("ESTUDIANTE_NO_ENCONTRADO");
    const intento = await intentoRepo.buscarPorChatId("CHAT-1");
    expect(intento?.intentosFallidos).toBe(1);
  });

  it("rechaza un alumno sin email de apoderado registrado", async () => {
    const estudiante = crearEstudiante({
      documento: "71000002",
      apoderado: { nombre: "Sin Email", telefono: "999999999", parentesco: "Padre", email: "" },
    });
    const estudianteRepo = new FakeEstudianteRepositorio([estudiante]);
    const codigoRepo = new FakeCodigoApoderadoRepositorio();
    const intentoRepo = new FakeApoderadoIntentoRepositorio();

    const resultado = await iniciarVinculacionApoderado(
      { chatId: "CHAT-1", dniEstudiante: "71000002" },
      { estudianteRepo, codigoRepo, intentoRepo }
    );

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("SIN_EMAIL_APODERADO");
  });

  it("bloquea el chat tras 5 intentos fallidos", async () => {
    const estudianteRepo = new FakeEstudianteRepositorio([]);
    const codigoRepo = new FakeCodigoApoderadoRepositorio();
    const intentoRepo = new FakeApoderadoIntentoRepositorio([crearApoderadoIntento({ intentosFallidos: 4 })]);

    const resultado = await iniciarVinculacionApoderado(
      { chatId: "CHAT-1", dniEstudiante: "00000000" },
      { estudianteRepo, codigoRepo, intentoRepo }
    );

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("CHAT_BLOQUEADO");
    const intento = await intentoRepo.buscarPorChatId("CHAT-1");
    expect(intento?.bloqueadoHasta).toBeDefined();
  });

  it("rechaza mientras el chat está bloqueado, incluso con un DNI válido", async () => {
    const estudiante = crearEstudiante({ documento: "71000001" });
    const estudianteRepo = new FakeEstudianteRepositorio([estudiante]);
    const codigoRepo = new FakeCodigoApoderadoRepositorio();
    const bloqueadoHasta = new Date(Date.now() + 60_000).toISOString();
    const intentoRepo = new FakeApoderadoIntentoRepositorio([crearApoderadoIntento({ bloqueadoHasta })]);

    const resultado = await iniciarVinculacionApoderado(
      { chatId: "CHAT-1", dniEstudiante: "71000001" },
      { estudianteRepo, codigoRepo, intentoRepo }
    );

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("CHAT_BLOQUEADO");
  });
});
