import { conectarMongoDB } from "@/compartido/infraestructura/mongodb-client";
import { IEstudianteRepositorio } from "@/modulos/estudiantes/aplicacion/i-estudiante-repositorio";
import { Estudiante } from "@/modulos/estudiantes/dominio/estudiante";
import { EstudianteModel } from "@/modulos/estudiantes/infraestructura/estudiante-schema";

export class EstudianteRepositorioMongo implements IEstudianteRepositorio {
  async buscarPorId(id: string): Promise<Estudiante | null> {
    await conectarMongoDB();
    const doc = await EstudianteModel.findById(id).lean();
    if (!doc) return null;
    return new Estudiante({
      id: doc._id,
      documento: doc.documento,
      nombreCompleto: doc.nombreCompleto,
      fechaNacimiento: doc.fechaNacimiento,
      apoderado: doc.apoderado,
      activo: doc.activo,
      fotoBase64: doc.fotoBase64 ?? null,
      fotoContentType: doc.fotoContentType ?? null,
      encodingFacial: doc.encodingFacial ?? null,
      encodingActualizadoEn: doc.encodingActualizadoEn ?? null,
      creadoEn: doc.creadoEn,
      actualizadoEn: doc.actualizadoEn,
    });
  }

  async buscarPorIds(ids: string[]): Promise<Estudiante[]> {
    await conectarMongoDB();
    if (ids.length === 0) return [];
    const docs = await EstudianteModel.find({ _id: { $in: ids } }).lean();
    return docs.map(
      (doc) =>
        new Estudiante({
          id: doc._id,
          documento: doc.documento,
          nombreCompleto: doc.nombreCompleto,
          fechaNacimiento: doc.fechaNacimiento,
          apoderado: doc.apoderado,
          activo: doc.activo,
          fotoBase64: doc.fotoBase64 ?? null,
          fotoContentType: doc.fotoContentType ?? null,
          encodingFacial: doc.encodingFacial ?? null,
          encodingActualizadoEn: doc.encodingActualizadoEn ?? null,
          creadoEn: doc.creadoEn,
          actualizadoEn: doc.actualizadoEn,
        })
    );
  }

  async listar(): Promise<Estudiante[]> {
    await conectarMongoDB();
    const docs = await EstudianteModel.find().lean();
    return docs.map(
      (doc) =>
        new Estudiante({
          id: doc._id,
          documento: doc.documento,
          nombreCompleto: doc.nombreCompleto,
          fechaNacimiento: doc.fechaNacimiento,
          apoderado: doc.apoderado,
          activo: doc.activo,
          fotoBase64: doc.fotoBase64 ?? null,
          fotoContentType: doc.fotoContentType ?? null,
          encodingFacial: doc.encodingFacial ?? null,
          encodingActualizadoEn: doc.encodingActualizadoEn ?? null,
          creadoEn: doc.creadoEn,
          actualizadoEn: doc.actualizadoEn,
        })
    );
  }

  async crear(estudiante: Estudiante): Promise<void> {
    await conectarMongoDB();
    await EstudianteModel.create({
      _id: estudiante.id,
      documento: estudiante.documento,
      nombreCompleto: estudiante.nombreCompleto,
      fechaNacimiento: estudiante.fechaNacimiento,
      apoderado: estudiante.apoderado,
      activo: estudiante.activo,
      fotoBase64: estudiante.fotoBase64,
      fotoContentType: estudiante.fotoContentType,
      encodingFacial: estudiante.encodingFacial,
      encodingActualizadoEn: estudiante.encodingActualizadoEn,
      creadoEn: estudiante.creadoEn,
      actualizadoEn: estudiante.actualizadoEn,
    });
  }

  async actualizar(estudiante: Estudiante): Promise<void> {
    await conectarMongoDB();
    await EstudianteModel.findByIdAndUpdate(estudiante.id, {
      documento: estudiante.documento,
      nombreCompleto: estudiante.nombreCompleto,
      fechaNacimiento: estudiante.fechaNacimiento,
      apoderado: estudiante.apoderado,
      activo: estudiante.activo,
      fotoBase64: estudiante.fotoBase64,
      fotoContentType: estudiante.fotoContentType,
      encodingFacial: estudiante.encodingFacial,
      encodingActualizadoEn: estudiante.encodingActualizadoEn,
      actualizadoEn: estudiante.actualizadoEn,
    });
  }

  async eliminar(id: string): Promise<void> {
    await conectarMongoDB();
    await EstudianteModel.findByIdAndDelete(id);
  }
}