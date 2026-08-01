import { describe, it, expect } from "vitest";
import { desactivarUsuario } from "@/modulos/usuarios/aplicacion/desactivar-usuario";
import { ROLES } from "@/config/constantes";
import { crearUsuario, FakeUsuarioRepositorio } from "@/test/fixtures-notas";

describe("desactivarUsuario", () => {
  it("retorna error si el usuario no existe", async () => {
    const repo = new FakeUsuarioRepositorio([]);

    const resultado = await desactivarUsuario("USR-NOPE", repo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("USUARIO_NO_ENCONTRADO");
  });

  it("impide desactivar al único administrador activo", async () => {
    const repo = new FakeUsuarioRepositorio([crearUsuario({ id: "USR-ADMIN", rol: ROLES.ADMIN, activo: true })]);

    const resultado = await desactivarUsuario("USR-ADMIN", repo);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("ULTIMO_ADMINISTRADOR");
  });

  it("permite desactivar a un administrador si queda otro administrador activo", async () => {
    const repo = new FakeUsuarioRepositorio([
      crearUsuario({ id: "USR-ADMIN-1", rol: ROLES.ADMIN, activo: true }),
      crearUsuario({ id: "USR-ADMIN-2", rol: ROLES.ADMIN, activo: true }),
    ]);

    const resultado = await desactivarUsuario("USR-ADMIN-1", repo);

    expect(resultado.ok).toBe(true);
  });

  it("permite desactivar a un profesor sin restricción", async () => {
    const repo = new FakeUsuarioRepositorio([crearUsuario({ id: "USR-PROF", rol: ROLES.PROFESOR, activo: true })]);

    const resultado = await desactivarUsuario("USR-PROF", repo);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.value.activo).toBe(false);
  });
});
