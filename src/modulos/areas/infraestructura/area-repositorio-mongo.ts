import { conectarMongoDB } from "@/compartido/infraestructura/mongodb-client";
import { IAreaRepositorio } from "@/modulos/areas/aplicacion/i-area-repositorio";
import { Area } from "@/modulos/areas/dominio/area";
import { AreaModel } from "@/modulos/areas/infraestructura/area-schema";

export class AreaRepositorioMongo implements IAreaRepositorio {
  async buscarPorId(id: string): Promise<Area | null> {
    await conectarMongoDB();
    const doc = await AreaModel.findById(id).lean();
    if (!doc) return null;
    return new Area({
      id: doc._id,
      nombre: doc.nombre,
      descripcion: doc.descripcion,
      activo: doc.activo,
      creadoEn: doc.creadoEn,
      actualizadoEn: doc.actualizadoEn,
    });
  }

  async listar(): Promise<Area[]> {
    await conectarMongoDB();
    const docs = await AreaModel.find().lean();
    return docs.map(
      (doc) =>
        new Area({
          id: doc._id,
          nombre: doc.nombre,
          descripcion: doc.descripcion,
          activo: doc.activo,
          creadoEn: doc.creadoEn,
          actualizadoEn: doc.actualizadoEn,
        })
    );
  }

  async crear(area: Area): Promise<void> {
    await conectarMongoDB();
    await AreaModel.create({
      _id: area.id,
      nombre: area.nombre,
      descripcion: area.descripcion,
      activo: area.activo,
      creadoEn: area.creadoEn,
      actualizadoEn: area.actualizadoEn,
    });
  }

  async actualizar(area: Area): Promise<void> {
    await conectarMongoDB();
    await AreaModel.findByIdAndUpdate(area.id, {
      nombre: area.nombre,
      descripcion: area.descripcion,
      activo: area.activo,
      actualizadoEn: area.actualizadoEn,
    });
  }

  async eliminar(id: string): Promise<void> {
    await conectarMongoDB();
    await AreaModel.findByIdAndDelete(id);
  }
}
