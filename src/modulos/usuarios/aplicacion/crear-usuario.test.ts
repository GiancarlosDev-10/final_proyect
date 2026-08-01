import { describe, it, expect } from "vitest";
import { crearUsuario } from "@/modulos/usuarios/aplicacion/crear-usuario";
import { ROLES } from "@/config/constantes";
import { crearUsuario as crearUsuarioFixture, FakeUsuarioRepositorio } from "@/test/fixtures-notas";

const DATOS_BASE = {
  email: "nuevo@colegio.edu.pe",
  password: "Clave#2026",
  nombreCompleto: "Usuario Nuevo",
  rol: ROLES.PROFESOR,
};

describe("crearUsuario", () => {
  it("retorna error si el email ya existe, sin importar mayúsculas/espacios (antes permitía duplicados así)", async () => {
    const repo = new FakeUsuarioRepositorio([crearUsuarioFixture({ email: "nuevo@colegio.edu.pe" })]);

    const resultado = await crearUsuario({ ...DATOS_BASE, email: "  Nuevo@Colegio.edu.pe  " }, repo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("EMAIL_DUPLICADO");
  });

  it("guarda el email normalizado (minúsculas, sin espacios) aunque se escriba distinto", async () => {
    const repo = new FakeUsuarioRepositorio([]);

    const resultado = await crearUsuario({ ...DATOS_BASE, email: "  Nuevo@Colegio.edu.pe  " }, repo);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.value.email).toBe("nuevo@colegio.edu.pe");
  });

  it("retorna error si la contraseña es débil", async () => {
    const repo = new FakeUsuarioRepositorio([]);

    const resultado = await crearUsuario({ ...DATOS_BASE, password: "123" }, repo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("PASSWORD_DEBIL");
  });
});
