import { describe, it, expect } from "vitest";
import { verificarCodigoApoderado } from "@/modulos/telegram/aplicacion/verificar-codigo-apoderado";
import {
  crearEstudiante,
  FakeEstudianteRepositorio,
  FakeCodigoApoderadoRepositorio,
  crearCodigoApoderado,
  FakeApoderadoVinculadoRepositorio,
  FakeApoderadoIntentoRepositorio,
  crearApoderadoIntento,
} from "@/test/fixtures-notas";

describe("verificarCodigoApoderado", () => {
  it("vincula el chat al estudiante cuando el código coincide", async () => {
    const estudiante = crearEstudiante({ id: "EST-1" });
    const estudianteRepo = new FakeEstudianteRepositorio([estudiante]);
    const codigoRepo = new FakeCodigoApoderadoRepositorio([
      crearCodigoApoderado({ chatId: "CHAT-1", estudianteId: "EST-1", codigo: "483920" }),
    ]);
    const vinculadoRepo = new FakeApoderadoVinculadoRepositorio();
    const intentoRepo = new FakeApoderadoIntentoRepositorio();

    const resultado = await verificarCodigoApoderado(
      { chatId: "CHAT-1", codigo: "483920" },
      { estudianteRepo, codigoRepo, vinculadoRepo, intentoRepo }
    );

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value.nombreEstudiante).toBe(estudiante.nombreCompleto);
      expect(resultado.value.nombreApoderado).toBe(estudiante.apoderado.nombre);
    }

    const vinculo = await vinculadoRepo.buscarPorChatIdYEstudianteId("CHAT-1", "EST-1");
    expect(vinculo).not.toBeNull();
    expect(await codigoRepo.buscarPorChatId("CHAT-1")).toBeNull();
  });

  it("rechaza si no hay ningún código pendiente para el chat", async () => {
    const estudianteRepo = new FakeEstudianteRepositorio([]);
    const codigoRepo = new FakeCodigoApoderadoRepositorio();
    const vinculadoRepo = new FakeApoderadoVinculadoRepositorio();
    const intentoRepo = new FakeApoderadoIntentoRepositorio();

    const resultado = await verificarCodigoApoderado(
      { chatId: "CHAT-1", codigo: "000000" },
      { estudianteRepo, codigoRepo, vinculadoRepo, intentoRepo }
    );

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("CODIGO_NO_ENCONTRADO");
  });

  it("rechaza un código expirado y lo elimina", async () => {
    const estudianteRepo = new FakeEstudianteRepositorio([crearEstudiante({ id: "EST-1" })]);
    const expiresAt = new Date(Date.now() - 1000).toISOString();
    const codigoRepo = new FakeCodigoApoderadoRepositorio([
      crearCodigoApoderado({ chatId: "CHAT-1", estudianteId: "EST-1", codigo: "483920", expiresAt }),
    ]);
    const vinculadoRepo = new FakeApoderadoVinculadoRepositorio();
    const intentoRepo = new FakeApoderadoIntentoRepositorio();

    const resultado = await verificarCodigoApoderado(
      { chatId: "CHAT-1", codigo: "483920" },
      { estudianteRepo, codigoRepo, vinculadoRepo, intentoRepo }
    );

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("CODIGO_EXPIRADO");
    expect(await codigoRepo.buscarPorChatId("CHAT-1")).toBeNull();
  });

  it("rechaza un código incorrecto y registra el intento fallido", async () => {
    const estudianteRepo = new FakeEstudianteRepositorio([crearEstudiante({ id: "EST-1" })]);
    const codigoRepo = new FakeCodigoApoderadoRepositorio([
      crearCodigoApoderado({ chatId: "CHAT-1", estudianteId: "EST-1", codigo: "483920" }),
    ]);
    const vinculadoRepo = new FakeApoderadoVinculadoRepositorio();
    const intentoRepo = new FakeApoderadoIntentoRepositorio();

    const resultado = await verificarCodigoApoderado(
      { chatId: "CHAT-1", codigo: "000000" },
      { estudianteRepo, codigoRepo, vinculadoRepo, intentoRepo }
    );

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("CODIGO_INCORRECTO");
    const intento = await intentoRepo.buscarPorChatId("CHAT-1");
    expect(intento?.intentosFallidos).toBe(1);
  });

  it("bloquea el chat tras 5 códigos incorrectos", async () => {
    const estudianteRepo = new FakeEstudianteRepositorio([crearEstudiante({ id: "EST-1" })]);
    const codigoRepo = new FakeCodigoApoderadoRepositorio([
      crearCodigoApoderado({ chatId: "CHAT-1", estudianteId: "EST-1", codigo: "483920" }),
    ]);
    const vinculadoRepo = new FakeApoderadoVinculadoRepositorio();
    const intentoRepo = new FakeApoderadoIntentoRepositorio([crearApoderadoIntento({ intentosFallidos: 4 })]);

    const resultado = await verificarCodigoApoderado(
      { chatId: "CHAT-1", codigo: "000000" },
      { estudianteRepo, codigoRepo, vinculadoRepo, intentoRepo }
    );

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("CHAT_BLOQUEADO");
  });

  it("rechaza mientras el chat está bloqueado, incluso con el código correcto", async () => {
    const estudianteRepo = new FakeEstudianteRepositorio([crearEstudiante({ id: "EST-1" })]);
    const codigoRepo = new FakeCodigoApoderadoRepositorio([
      crearCodigoApoderado({ chatId: "CHAT-1", estudianteId: "EST-1", codigo: "483920" }),
    ]);
    const vinculadoRepo = new FakeApoderadoVinculadoRepositorio();
    const bloqueadoHasta = new Date(Date.now() + 60_000).toISOString();
    const intentoRepo = new FakeApoderadoIntentoRepositorio([crearApoderadoIntento({ bloqueadoHasta })]);

    const resultado = await verificarCodigoApoderado(
      { chatId: "CHAT-1", codigo: "483920" },
      { estudianteRepo, codigoRepo, vinculadoRepo, intentoRepo }
    );

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("CHAT_BLOQUEADO");
  });
});
