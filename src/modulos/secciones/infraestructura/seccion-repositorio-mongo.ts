import { conectarMongoDB } from "@/compartido/infraestructura/mongodb-client";
import { ISeccionRepositorio } from "@/modulos/secciones/aplicacion/i-seccion-repositorio";
import { Seccion } from "@/modulos/secciones/dominio/seccion";
import { SeccionModel } from "@/modulos/secciones/infraestructura/seccion-schema";

export class SeccionRepositorioMongo implements ISeccionRepositorio {
  async buscarPorId(id: string): Promise<Seccion | null> {
    await conectarMongoDB();
    const doc = await SeccionModel.findById(id).lean();
    if (!doc) return null;
    return new Seccion({
      id: doc._id,
      nombre: doc.nombre,
      grado: doc.grado,
      anio: doc.anio,
      activo: doc.activo,
      creadoEn: doc.creadoEn,
      actualizadoEn: doc.actualizadoEn,
    });
  }

  async listar(): Promise<Seccion[]> {
    await conectarMongoDB();
    const docs = await SeccionModel.find().lean();
    return docs.map(
      (doc) =>
        new Seccion({
          id: doc._id,
          nombre: doc.nombre,
          grado: doc.grado,
          anio: doc.anio,
          activo: doc.activo,
          creadoEn: doc.creadoEn,
          actualizadoEn: doc.actualizadoEn,
        })
    );
  }

  async crear(seccion: Seccion): Promise<void> {
    await conectarMongoDB();
    await SeccionModel.create({
      _id: seccion.id,
      nombre: seccion.nombre,
      grado: seccion.grado,
      anio: seccion.anio,
      activo: seccion.activo,
      creadoEn: seccion.creadoEn,
      actualizadoEn: seccion.actualizadoEn,
    });
  }

  async actualizar(seccion: Seccion): Promise<void> {
    await conectarMongoDB();
    await SeccionModel.findByIdAndUpdate(seccion.id, {
      nombre: seccion.nombre,
      grado: seccion.grado,
      anio: seccion.anio,
      activo: seccion.activo,
      actualizadoEn: seccion.actualizadoEn,
    });
  }

  async eliminar(id: string): Promise<void> {
    await conectarMongoDB();
    await SeccionModel.findByIdAndDelete(id);
  }
}