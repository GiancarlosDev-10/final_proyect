import { conectarMongoDB } from "@/compartido/infraestructura/mongodb-client";
import { IMatriculaRepositorio } from "@/modulos/matriculas/aplicacion/i-matricula-repositorio";
import { Matricula } from "@/modulos/matriculas/dominio/matricula";
import { MatriculaModel } from "@/modulos/matriculas/infraestructura/matricula-schema";

export class MatriculaRepositorioMongo implements IMatriculaRepositorio {
  async buscarPorId(id: string): Promise<Matricula | null> {
    await conectarMongoDB();
    const doc = await MatriculaModel.findById(id).lean();
    if (!doc) return null;
    return new Matricula({
      id: doc._id,
      estudianteId: doc.estudianteId,
      seccionId: doc.seccionId,
      anio: doc.anio,
      activo: doc.activo,
      creadoEn: doc.creadoEn,
      actualizadoEn: doc.actualizadoEn,
    });
  }

  async buscarPorEstudianteYAnio(estudianteId: string, anio: number): Promise<Matricula | null> {
    await conectarMongoDB();
    const doc = await MatriculaModel.findOne({ estudianteId, anio }).lean();
    if (!doc) return null;
    return new Matricula({
      id: doc._id,
      estudianteId: doc.estudianteId,
      seccionId: doc.seccionId,
      anio: doc.anio,
      activo: doc.activo,
      creadoEn: doc.creadoEn,
      actualizadoEn: doc.actualizadoEn,
    });
  }

  async listar(): Promise<Matricula[]> {
    await conectarMongoDB();
    const docs = await MatriculaModel.find().lean();
    return docs.map((doc) => new Matricula({
      id: doc._id,
      estudianteId: doc.estudianteId,
      seccionId: doc.seccionId,
      anio: doc.anio,
      activo: doc.activo,
      creadoEn: doc.creadoEn,
      actualizadoEn: doc.actualizadoEn,
    }));
  }

  async listarPorSeccion(seccionId: string): Promise<Matricula[]> {
    await conectarMongoDB();
    const docs = await MatriculaModel.find({ seccionId }).lean();
    return docs.map((doc) => new Matricula({
      id: doc._id,
      estudianteId: doc.estudianteId,
      seccionId: doc.seccionId,
      anio: doc.anio,
      activo: doc.activo,
      creadoEn: doc.creadoEn,
      actualizadoEn: doc.actualizadoEn,
    }));
  }

  async crear(matricula: Matricula): Promise<void> {
    await conectarMongoDB();
    await MatriculaModel.create({
      _id: matricula.id,
      estudianteId: matricula.estudianteId,
      seccionId: matricula.seccionId,
      anio: matricula.anio,
      activo: matricula.activo,
      creadoEn: matricula.creadoEn,
      actualizadoEn: matricula.actualizadoEn,
    });
  }

  async actualizar(matricula: Matricula): Promise<void> {
    await conectarMongoDB();
    await MatriculaModel.findByIdAndUpdate(matricula.id, {
      seccionId: matricula.seccionId,
      anio: matricula.anio,
      activo: matricula.activo,
      actualizadoEn: matricula.actualizadoEn,
    });
  }

  async eliminar(id: string): Promise<void> {
    await conectarMongoDB();
    await MatriculaModel.findByIdAndDelete(id);
  }
}