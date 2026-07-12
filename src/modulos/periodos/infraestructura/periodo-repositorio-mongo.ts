import { conectarMongoDB } from "@/compartido/infraestructura/mongodb-client";
import { IPeriodoRepositorio } from "@/modulos/periodos/aplicacion/i-periodo-repositorio";
import { Periodo } from "@/modulos/periodos/dominio/periodo";
import { PeriodoModel } from "@/modulos/periodos/infraestructura/periodo-schema";

export class PeriodoRepositorioMongo implements IPeriodoRepositorio {
  async buscarPorId(id: string): Promise<Periodo | null> {
    await conectarMongoDB();
    const doc = await PeriodoModel.findById(id).lean();
    if (!doc) return null;
    return new Periodo({
      id: doc._id,
      nombre: doc.nombre,
      anio: doc.anio,
      estado: doc.estado,
      fechaInicio: doc.fechaInicio,
      fechaFin: doc.fechaFin,
      creadoEn: doc.creadoEn,
      actualizadoEn: doc.actualizadoEn,
    });
  }

  async listar(): Promise<Periodo[]> {
    await conectarMongoDB();
    const docs = await PeriodoModel.find().lean();
    return docs.map(
      (doc) =>
        new Periodo({
          id: doc._id,
          nombre: doc.nombre,
          anio: doc.anio,
          estado: doc.estado,
          fechaInicio: doc.fechaInicio,
          fechaFin: doc.fechaFin,
          creadoEn: doc.creadoEn,
          actualizadoEn: doc.actualizadoEn,
        })
    );
  }

  async crear(periodo: Periodo): Promise<void> {
    await conectarMongoDB();
    await PeriodoModel.create({
      _id: periodo.id,
      nombre: periodo.nombre,
      anio: periodo.anio,
      estado: periodo.estado,
      fechaInicio: periodo.fechaInicio,
      fechaFin: periodo.fechaFin,
      creadoEn: periodo.creadoEn,
      actualizadoEn: periodo.actualizadoEn,
    });
  }

  async actualizar(periodo: Periodo): Promise<void> {
    await conectarMongoDB();
    await PeriodoModel.findByIdAndUpdate(periodo.id, {
      nombre: periodo.nombre,
      anio: periodo.anio,
      estado: periodo.estado,
      fechaInicio: periodo.fechaInicio,
      fechaFin: periodo.fechaFin,
      actualizadoEn: periodo.actualizadoEn,
    });
  }

  async eliminar(id: string): Promise<void> {
    await conectarMongoDB();
    await PeriodoModel.findByIdAndDelete(id);
  }
}