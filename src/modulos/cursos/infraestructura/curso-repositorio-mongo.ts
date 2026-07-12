import { conectarMongoDB } from "@/compartido/infraestructura/mongodb-client";
import { ICursoRepositorio } from "@/modulos/cursos/aplicacion/i-curso-repositorio";
import { Curso } from "@/modulos/cursos/dominio/curso";
import { CursoModel } from "@/modulos/cursos/infraestructura/curso-schema";

export class CursoRepositorioMongo implements ICursoRepositorio {
  async buscarPorId(id: string): Promise<Curso | null> {
    await conectarMongoDB();
    const doc = await CursoModel.findById(id).lean();
    if (!doc) return null;
    return new Curso({
      id: doc._id,
      nombre: doc.nombre,
      descripcion: doc.descripcion,
      areaId: doc.areaId,
      activo: doc.activo,
      creadoEn: doc.creadoEn,
      actualizadoEn: doc.actualizadoEn,
    });
  }

  async listar(): Promise<Curso[]> {
    await conectarMongoDB();
    const docs = await CursoModel.find().lean();
    return docs.map(
      (doc) =>
        new Curso({
          id: doc._id,
          nombre: doc.nombre,
          descripcion: doc.descripcion,
          areaId: doc.areaId,
          activo: doc.activo,
          creadoEn: doc.creadoEn,
          actualizadoEn: doc.actualizadoEn,
        })
    );
  }

  async crear(curso: Curso): Promise<void> {
    await conectarMongoDB();
    await CursoModel.create({
      _id: curso.id,
      nombre: curso.nombre,
      descripcion: curso.descripcion,
      areaId: curso.areaId,
      activo: curso.activo,
      creadoEn: curso.creadoEn,
      actualizadoEn: curso.actualizadoEn,
    });
  }

  async actualizar(curso: Curso): Promise<void> {
    await conectarMongoDB();
    await CursoModel.findByIdAndUpdate(curso.id, {
      nombre: curso.nombre,
      descripcion: curso.descripcion,
      areaId: curso.areaId,
      activo: curso.activo,
      actualizadoEn: curso.actualizadoEn,
    });
  }

  async eliminar(id: string): Promise<void> {
    await conectarMongoDB();
    await CursoModel.findByIdAndDelete(id);
  }
}