import { conectarMongoDB } from "@/compartido/infraestructura/mongodb-client";
import { IUsuarioRepositorio } from "@/modulos/usuarios/aplicacion/i-usuario-repositorio";
import { Usuario } from "@/modulos/usuarios/dominio/usuario";
import { UsuarioModel } from "@/modulos/usuarios/infraestructura/usuario-schema";

export class UsuarioRepositorioMongo implements IUsuarioRepositorio {
  async buscarPorId(id: string): Promise<Usuario | null> {
    await conectarMongoDB();
    const doc = await UsuarioModel.findById(id).lean();
    if (!doc) return null;
    return new Usuario({
      id: doc._id,
      email: doc.email,
      passwordHash: doc.passwordHash,
      rol: doc.rol,
      nombreCompleto: doc.nombreCompleto,
      activo: doc.activo,
      creadoEn: doc.creadoEn,
      actualizadoEn: doc.actualizadoEn,
    });
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    await conectarMongoDB();
    const doc = await UsuarioModel.findOne({ email }).lean();
    if (!doc) return null;
    return new Usuario({
      id: doc._id,
      email: doc.email,
      passwordHash: doc.passwordHash,
      rol: doc.rol,
      nombreCompleto: doc.nombreCompleto,
      activo: doc.activo,
      creadoEn: doc.creadoEn,
      actualizadoEn: doc.actualizadoEn,
    });
  }

  async listar(): Promise<Usuario[]> {
    await conectarMongoDB();
    const docs = await UsuarioModel.find().lean();
    return docs.map(
      (doc) =>
        new Usuario({
          id: doc._id,
          email: doc.email,
          passwordHash: doc.passwordHash,
          rol: doc.rol,
          nombreCompleto: doc.nombreCompleto,
          activo: doc.activo,
          creadoEn: doc.creadoEn,
          actualizadoEn: doc.actualizadoEn,
        })
    );
  }

  async crear(usuario: Usuario): Promise<void> {
    await conectarMongoDB();
    await UsuarioModel.create({
      _id: usuario.id,
      email: usuario.email,
      passwordHash: usuario.passwordHash,
      rol: usuario.rol,
      nombreCompleto: usuario.nombreCompleto,
      activo: usuario.activo,
      creadoEn: usuario.creadoEn,
      actualizadoEn: usuario.actualizadoEn,
    });
  }

  async actualizar(usuario: Usuario): Promise<void> {
    await conectarMongoDB();
    await UsuarioModel.findByIdAndUpdate(usuario.id, {
      email: usuario.email,
      passwordHash: usuario.passwordHash,
      rol: usuario.rol,
      nombreCompleto: usuario.nombreCompleto,
      activo: usuario.activo,
      actualizadoEn: usuario.actualizadoEn,
    });
  }
}