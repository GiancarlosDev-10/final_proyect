import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import { configurarPinTelegram } from "@/modulos/usuarios/aplicacion/configurar-pin-telegram";
import { ROLES } from "@/config/constantes";
import { crearUsuario, FakeUsuarioRepositorio } from "@/test/fixtures-notas";

describe("configurarPinTelegram", () => {
  it("retorna error si otro profesor activo ya usa ese mismo PIN", async () => {
    const pinExistente = "482913";
    const hashExistente = await bcrypt.hash(pinExistente, 10);
    const repo = new FakeUsuarioRepositorio([
      crearUsuario({ id: "USR-1", rol: ROLES.PROFESOR, activo: true, pinTelegramHash: hashExistente }),
      crearUsuario({ id: "USR-2", rol: ROLES.PROFESOR, activo: true }),
    ]);

    const resultado = await configurarPinTelegram({ id: "USR-2", pin: pinExistente }, repo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("PIN_TELEGRAM_DUPLICADO");
  });

  it("no se bloquea a sí mismo al volver a guardar el mismo PIN que ya tenía", async () => {
    const pinPropio = "482913";
    const hashPropio = await bcrypt.hash(pinPropio, 10);
    const repo = new FakeUsuarioRepositorio([crearUsuario({ id: "USR-1", rol: ROLES.PROFESOR, activo: true, pinTelegramHash: hashPropio })]);

    const resultado = await configurarPinTelegram({ id: "USR-1", pin: pinPropio }, repo);

    expect(resultado.ok).toBe(true);
  });

  it("no bloquea si el PIN coincide con el de un profesor INACTIVO", async () => {
    const pinExistente = "482913";
    const hashExistente = await bcrypt.hash(pinExistente, 10);
    const repo = new FakeUsuarioRepositorio([
      crearUsuario({ id: "USR-1", rol: ROLES.PROFESOR, activo: false, pinTelegramHash: hashExistente }),
      crearUsuario({ id: "USR-2", rol: ROLES.PROFESOR, activo: true }),
    ]);

    const resultado = await configurarPinTelegram({ id: "USR-2", pin: pinExistente }, repo);

    expect(resultado.ok).toBe(true);
  });

  it("configura el PIN cuando no hay colisión", async () => {
    const repo = new FakeUsuarioRepositorio([crearUsuario({ id: "USR-1", rol: ROLES.PROFESOR, activo: true })]);

    const resultado = await configurarPinTelegram({ id: "USR-1", pin: "123456" }, repo);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.value.pinTelegramHash).toBeDefined();
  });
});
