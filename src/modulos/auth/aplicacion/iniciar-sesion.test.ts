import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import { iniciarSesion } from "@/modulos/auth/aplicacion/iniciar-sesion";
import {
  crearUsuario,
  FakeUsuarioRepositorio,
  FakeLoginIntentoRepositorio,
  crearLoginIntento,
} from "@/test/fixtures-notas";

async function usuarioConPassword(password: string, overrides = {}) {
  return crearUsuario({ passwordHash: await bcrypt.hash(password, 4), ...overrides });
}

describe("iniciarSesion", () => {
  it("autentica con email y contraseña correctos", async () => {
    const usuario = await usuarioConPassword("Clave#2026");
    const usuarioRepo = new FakeUsuarioRepositorio([usuario]);
    const intentoRepo = new FakeLoginIntentoRepositorio();

    const resultado = await iniciarSesion(usuario.email, "Clave#2026", usuarioRepo, intentoRepo);

    expect(resultado.ok).toBe(true);
  });

  it("autentica sin importar mayúsculas/espacios en el email tipeado (antes fallaba si no coincidía exacto)", async () => {
    const usuario = await usuarioConPassword("Clave#2026", { email: "admin@colegio.edu.pe" });
    const usuarioRepo = new FakeUsuarioRepositorio([usuario]);
    const intentoRepo = new FakeLoginIntentoRepositorio();

    const resultado = await iniciarSesion("  Admin@Colegio.edu.pe  ", "Clave#2026", usuarioRepo, intentoRepo);

    expect(resultado.ok).toBe(true);
  });

  it("rechaza un email inexistente sin crear un registro de intentos", async () => {
    const usuarioRepo = new FakeUsuarioRepositorio([]);
    const intentoRepo = new FakeLoginIntentoRepositorio();

    const resultado = await iniciarSesion("nadie@colegio.edu.pe", "cualquiera", usuarioRepo, intentoRepo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("CREDENCIALES_INVALIDAS");
    expect(await intentoRepo.buscarPorEmail("nadie@colegio.edu.pe")).toBeNull();
  });

  it("rechaza a un usuario inactivo aunque la contraseña sea correcta", async () => {
    const usuario = await usuarioConPassword("Clave#2026", { activo: false });
    const usuarioRepo = new FakeUsuarioRepositorio([usuario]);
    const intentoRepo = new FakeLoginIntentoRepositorio();

    const resultado = await iniciarSesion(usuario.email, "Clave#2026", usuarioRepo, intentoRepo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("USUARIO_INACTIVO");
  });

  it("rechaza una contraseña incorrecta y registra el intento fallido", async () => {
    const usuario = await usuarioConPassword("Clave#2026");
    const usuarioRepo = new FakeUsuarioRepositorio([usuario]);
    const intentoRepo = new FakeLoginIntentoRepositorio();

    const resultado = await iniciarSesion(usuario.email, "otra-clave", usuarioRepo, intentoRepo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("CREDENCIALES_INVALIDAS");
    const intento = await intentoRepo.buscarPorEmail(usuario.email.toLowerCase());
    expect(intento?.intentosFallidos).toBe(1);
  });

  it("bloquea la cuenta tras 5 intentos fallidos", async () => {
    const usuario = await usuarioConPassword("Clave#2026");
    const usuarioRepo = new FakeUsuarioRepositorio([usuario]);
    const intentoRepo = new FakeLoginIntentoRepositorio([
      crearLoginIntento({ email: usuario.email.toLowerCase(), intentosFallidos: 4 }),
    ]);

    const resultado = await iniciarSesion(usuario.email, "otra-clave", usuarioRepo, intentoRepo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("CUENTA_BLOQUEADA");
    const intento = await intentoRepo.buscarPorEmail(usuario.email.toLowerCase());
    expect(intento?.bloqueadoHasta).toBeDefined();
  });

  it("rechaza el login mientras la cuenta está bloqueada, incluso con la contraseña correcta", async () => {
    const usuario = await usuarioConPassword("Clave#2026");
    const usuarioRepo = new FakeUsuarioRepositorio([usuario]);
    const bloqueadoHasta = new Date(Date.now() + 60_000).toISOString();
    const intentoRepo = new FakeLoginIntentoRepositorio([
      crearLoginIntento({ email: usuario.email.toLowerCase(), bloqueadoHasta }),
    ]);

    const resultado = await iniciarSesion(usuario.email, "Clave#2026", usuarioRepo, intentoRepo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("CUENTA_BLOQUEADA");
  });

  it("permite autenticar de nuevo una vez que el bloqueo ya expiró", async () => {
    const usuario = await usuarioConPassword("Clave#2026");
    const usuarioRepo = new FakeUsuarioRepositorio([usuario]);
    const bloqueadoHasta = new Date(Date.now() - 60_000).toISOString();
    const intentoRepo = new FakeLoginIntentoRepositorio([
      crearLoginIntento({ email: usuario.email.toLowerCase(), bloqueadoHasta }),
    ]);

    const resultado = await iniciarSesion(usuario.email, "Clave#2026", usuarioRepo, intentoRepo);

    expect(resultado.ok).toBe(true);
  });

  it("resetea los intentos fallidos tras un login exitoso", async () => {
    const usuario = await usuarioConPassword("Clave#2026");
    const usuarioRepo = new FakeUsuarioRepositorio([usuario]);
    const intentoRepo = new FakeLoginIntentoRepositorio([
      crearLoginIntento({ email: usuario.email.toLowerCase(), intentosFallidos: 3 }),
    ]);

    await iniciarSesion(usuario.email, "Clave#2026", usuarioRepo, intentoRepo);

    const intento = await intentoRepo.buscarPorEmail(usuario.email.toLowerCase());
    expect(intento).toBeNull();
  });
});
