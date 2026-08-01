import { describe, it, expect } from "vitest";
import { actualizarUsuario } from "@/modulos/usuarios/aplicacion/actualizar-usuario";
import { ROLES } from "@/config/constantes";
import { crearUsuario, FakeUsuarioRepositorio } from "@/test/fixtures-notas";

describe("actualizarUsuario", () => {
  it("retorna error si el usuario no existe", async () => {
    const repo = new FakeUsuarioRepositorio([]);

    const resultado = await actualizarUsuario(
      { id: "USR-NOPE", email: "x@x.com", nombreCompleto: "X", rol: ROLES.PROFESOR, activo: true },
      repo
    );

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("USUARIO_NO_ENCONTRADO");
  });

  it("retorna error si el email ya lo usa otro usuario", async () => {
    const repo = new FakeUsuarioRepositorio([
      crearUsuario({ id: "USR-1", email: "uno@colegio.edu.pe" }),
      crearUsuario({ id: "USR-2", email: "dos@colegio.edu.pe" }),
    ]);

    const resultado = await actualizarUsuario(
      { id: "USR-1", email: "dos@colegio.edu.pe", nombreCompleto: "X", rol: ROLES.PROFESOR, activo: true },
      repo
    );

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("EMAIL_DUPLICADO");
  });

  it("impide que el único administrador activo se quite el rol de ADMIN", async () => {
    const repo = new FakeUsuarioRepositorio([crearUsuario({ id: "USR-ADMIN", email: "admin@colegio.edu.pe", rol: ROLES.ADMIN, activo: true })]);

    const resultado = await actualizarUsuario(
      { id: "USR-ADMIN", email: "admin@colegio.edu.pe", nombreCompleto: "Admin", rol: ROLES.PROFESOR, activo: true },
      repo
    );

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("ULTIMO_ADMINISTRADOR");
  });

  it("impide que el único administrador activo se desactive a sí mismo vía edición", async () => {
    const repo = new FakeUsuarioRepositorio([crearUsuario({ id: "USR-ADMIN", email: "admin@colegio.edu.pe", rol: ROLES.ADMIN, activo: true })]);

    const resultado = await actualizarUsuario(
      { id: "USR-ADMIN", email: "admin@colegio.edu.pe", nombreCompleto: "Admin", rol: ROLES.ADMIN, activo: false },
      repo
    );

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("ULTIMO_ADMINISTRADOR");
  });

  it("permite el cambio si queda otro administrador activo", async () => {
    const repo = new FakeUsuarioRepositorio([
      crearUsuario({ id: "USR-ADMIN-1", email: "uno@colegio.edu.pe", rol: ROLES.ADMIN, activo: true }),
      crearUsuario({ id: "USR-ADMIN-2", email: "dos@colegio.edu.pe", rol: ROLES.ADMIN, activo: true }),
    ]);

    const resultado = await actualizarUsuario(
      { id: "USR-ADMIN-1", email: "uno@colegio.edu.pe", nombreCompleto: "Uno", rol: ROLES.PROFESOR, activo: true },
      repo
    );

    expect(resultado.ok).toBe(true);
  });

  it("permite editar a un profesor sin restricción de último admin", async () => {
    const repo = new FakeUsuarioRepositorio([crearUsuario({ id: "USR-PROF", email: "prof@colegio.edu.pe", rol: ROLES.PROFESOR, activo: true })]);

    const resultado = await actualizarUsuario(
      { id: "USR-PROF", email: "prof@colegio.edu.pe", nombreCompleto: "Profesor Editado", rol: ROLES.PROFESOR, activo: false },
      repo
    );

    expect(resultado.ok).toBe(true);
  });
});
