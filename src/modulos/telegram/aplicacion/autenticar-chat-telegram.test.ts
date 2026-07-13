import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import { autenticarChatTelegram } from "@/modulos/telegram/aplicacion/autenticar-chat-telegram";
import {
  crearUsuario,
  FakeUsuarioRepositorio,
  FakeTelegramChatRepositorio,
  FakeTelegramIntentoRepositorio,
  crearTelegramIntento,
} from "@/test/fixtures-notas";

async function usuarioConPin(pin: string, overrides = {}) {
  return crearUsuario({ pinTelegramHash: await bcrypt.hash(pin, 4), ...overrides });
}

describe("autenticarChatTelegram", () => {
  it("vincula el chat cuando el PIN coincide con un profesor", async () => {
    const profesor = await usuarioConPin("483920", { id: "USR-1", nombreCompleto: "Profesor Demo" });
    const usuarioRepo = new FakeUsuarioRepositorio([profesor]);
    const chatRepo = new FakeTelegramChatRepositorio();
    const intentoRepo = new FakeTelegramIntentoRepositorio();

    const resultado = await autenticarChatTelegram({ chatId: "CHAT-1", pin: "483920" }, usuarioRepo, chatRepo, intentoRepo);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value.profesorId).toBe("USR-1");
      expect(resultado.value.nombreProfesor).toBe("Profesor Demo");
    }
    const chat = await chatRepo.buscarPorChatId("CHAT-1");
    expect(chat?.profesorId).toBe("USR-1");
  });

  it("identifica al profesor correcto entre varios con PIN configurado", async () => {
    const profesorA = await usuarioConPin("111111", { id: "USR-A" });
    const profesorB = await usuarioConPin("222222", { id: "USR-B" });
    const usuarioRepo = new FakeUsuarioRepositorio([profesorA, profesorB]);
    const chatRepo = new FakeTelegramChatRepositorio();
    const intentoRepo = new FakeTelegramIntentoRepositorio();

    const resultado = await autenticarChatTelegram({ chatId: "CHAT-1", pin: "222222" }, usuarioRepo, chatRepo, intentoRepo);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.value.profesorId).toBe("USR-B");
  });

  it("ignora profesores sin PIN configurado o inactivos", async () => {
    const sinPin = crearUsuario({ id: "USR-SIN-PIN", pinTelegramHash: undefined });
    const inactivo = await usuarioConPin("483920", { id: "USR-INACTIVO", activo: false });
    const usuarioRepo = new FakeUsuarioRepositorio([sinPin, inactivo]);
    const chatRepo = new FakeTelegramChatRepositorio();
    const intentoRepo = new FakeTelegramIntentoRepositorio();

    const resultado = await autenticarChatTelegram({ chatId: "CHAT-1", pin: "483920" }, usuarioRepo, chatRepo, intentoRepo);

    expect(resultado.ok).toBe(false);
  });

  it("rechaza un PIN incorrecto y registra el intento fallido", async () => {
    const profesor = await usuarioConPin("483920");
    const usuarioRepo = new FakeUsuarioRepositorio([profesor]);
    const chatRepo = new FakeTelegramChatRepositorio();
    const intentoRepo = new FakeTelegramIntentoRepositorio();

    const resultado = await autenticarChatTelegram({ chatId: "CHAT-1", pin: "000000" }, usuarioRepo, chatRepo, intentoRepo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("PIN_INCORRECTO");
    const intento = await intentoRepo.buscarPorChatId("CHAT-1");
    expect(intento?.intentosFallidos).toBe(1);
  });

  it("bloquea el chat tras 5 intentos fallidos", async () => {
    const profesor = await usuarioConPin("483920");
    const usuarioRepo = new FakeUsuarioRepositorio([profesor]);
    const chatRepo = new FakeTelegramChatRepositorio();
    const intentoRepo = new FakeTelegramIntentoRepositorio([crearTelegramIntento({ intentosFallidos: 4 })]);

    const resultado = await autenticarChatTelegram({ chatId: "CHAT-1", pin: "000000" }, usuarioRepo, chatRepo, intentoRepo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("CHAT_BLOQUEADO");
    const intento = await intentoRepo.buscarPorChatId("CHAT-1");
    expect(intento?.bloqueadoHasta).toBeDefined();
  });

  it("rechaza la autenticación mientras el chat está bloqueado, incluso con el PIN correcto", async () => {
    const profesor = await usuarioConPin("483920");
    const usuarioRepo = new FakeUsuarioRepositorio([profesor]);
    const chatRepo = new FakeTelegramChatRepositorio();
    const bloqueadoHasta = new Date(Date.now() + 60_000).toISOString();
    const intentoRepo = new FakeTelegramIntentoRepositorio([crearTelegramIntento({ bloqueadoHasta })]);

    const resultado = await autenticarChatTelegram({ chatId: "CHAT-1", pin: "483920" }, usuarioRepo, chatRepo, intentoRepo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("CHAT_BLOQUEADO");
  });

  it("permite autenticar de nuevo una vez que el bloqueo ya expiró", async () => {
    const profesor = await usuarioConPin("483920");
    const usuarioRepo = new FakeUsuarioRepositorio([profesor]);
    const chatRepo = new FakeTelegramChatRepositorio();
    const bloqueadoHasta = new Date(Date.now() - 60_000).toISOString();
    const intentoRepo = new FakeTelegramIntentoRepositorio([crearTelegramIntento({ bloqueadoHasta })]);

    const resultado = await autenticarChatTelegram({ chatId: "CHAT-1", pin: "483920" }, usuarioRepo, chatRepo, intentoRepo);

    expect(resultado.ok).toBe(true);
  });

  it("resetea los intentos fallidos tras un login exitoso", async () => {
    const profesor = await usuarioConPin("483920");
    const usuarioRepo = new FakeUsuarioRepositorio([profesor]);
    const chatRepo = new FakeTelegramChatRepositorio();
    const intentoRepo = new FakeTelegramIntentoRepositorio([crearTelegramIntento({ intentosFallidos: 3 })]);

    await autenticarChatTelegram({ chatId: "CHAT-1", pin: "483920" }, usuarioRepo, chatRepo, intentoRepo);

    const intento = await intentoRepo.buscarPorChatId("CHAT-1");
    expect(intento).toBeNull();
  });
});
