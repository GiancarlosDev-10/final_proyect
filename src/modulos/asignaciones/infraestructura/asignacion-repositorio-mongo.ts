import { conectarMongoDB } from "@/compartido/infraestructura/mongodb-client";
import { IAsignacionRepositorio } from "@/modulos/asignaciones/aplicacion/i-asignacion-repositorio";
import { Asignacion } from "@/modulos/asignaciones/dominio/asignacion";
import { AsignacionModel } from "@/modulos/asignaciones/infraestructura/asignacion-schema";

export class AsignacionRepositorioMongo implements IAsignacionRepositorio {
  async buscarPorId(id: string): Promise<Asignacion | null> {
    await conectarMongoDB();
    const doc = await AsignacionModel.findById(id).lean();
    if (!doc) return null;
    return new Asignacion({
      id: doc._id,
      profesorId: doc.profesorId,
      cursoId: doc.cursoId,
      seccionId: doc.seccionId,
      periodoId: doc.periodoId,
      activo: doc.activo,
      creadoEn: doc.creadoEn,
      actualizadoEn: doc.actualizadoEn,
    });
  }

  async buscarActiva(
    profesorId: string,
    cursoId: string,
    seccionId: string,
    periodoId: string
  ): Promise<Asignacion | null> {
    await conectarMongoDB();
    const doc = await AsignacionModel.findOne({
      profesorId,
      cursoId,
      seccionId,
      periodoId,
      activo: true,
    }).lean();
    if (!doc) return null;
    return new Asignacion({
      id: doc._id,
      profesorId: doc.profesorId,
      cursoId: doc.cursoId,
      seccionId: doc.seccionId,
      periodoId: doc.periodoId,
      activo: doc.activo,
      creadoEn: doc.creadoEn,
      actualizadoEn: doc.actualizadoEn,
    });
  }

  async listar(): Promise<Asignacion[]> {
    await conectarMongoDB();
    const docs = await AsignacionModel.find().lean();
    return docs.map((doc) => new Asignacion({
      id: doc._id,
      profesorId: doc.profesorId,
      cursoId: doc.cursoId,
      seccionId: doc.seccionId,
      periodoId: doc.periodoId,
      activo: doc.activo,
      creadoEn: doc.creadoEn,
      actualizadoEn: doc.actualizadoEn,
    }));
  }

  async listarPorProfesor(profesorId: string): Promise<Asignacion[]> {
    await conectarMongoDB();
    const docs = await AsignacionModel.find({ profesorId }).lean();
    return docs.map((doc) => new Asignacion({
      id: doc._id,
      profesorId: doc.profesorId,
      cursoId: doc.cursoId,
      seccionId: doc.seccionId,
      periodoId: doc.periodoId,
      activo: doc.activo,
      creadoEn: doc.creadoEn,
      actualizadoEn: doc.actualizadoEn,
    }));
  }

  async crear(asignacion: Asignacion): Promise<void> {
    await conectarMongoDB();
    await AsignacionModel.create({
      _id: asignacion.id,
      profesorId: asignacion.profesorId,
      cursoId: asignacion.cursoId,
      seccionId: asignacion.seccionId,
      periodoId: asignacion.periodoId,
      activo: asignacion.activo,
      creadoEn: asignacion.creadoEn,
      actualizadoEn: asignacion.actualizadoEn,
    });
  }

  async actualizar(asignacion: Asignacion): Promise<void> {
    await conectarMongoDB();
    await AsignacionModel.findByIdAndUpdate(asignacion.id, {
      profesorId: asignacion.profesorId,
      cursoId: asignacion.cursoId,
      seccionId: asignacion.seccionId,
      periodoId: asignacion.periodoId,
      activo: asignacion.activo,
      actualizadoEn: asignacion.actualizadoEn,
    });
  }

  async eliminar(id: string): Promise<void> {
    await conectarMongoDB();
    await AsignacionModel.findByIdAndDelete(id);
  }
}