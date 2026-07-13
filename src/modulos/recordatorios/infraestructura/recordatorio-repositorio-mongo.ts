import { conectarMongoDB } from "@/compartido/infraestructura/mongodb-client";
import { IRecordatorioRepositorio } from "@/modulos/recordatorios/aplicacion/i-recordatorio-repositorio";
import { Recordatorio } from "@/modulos/recordatorios/dominio/recordatorio";
import { RecordatorioModel } from "@/modulos/recordatorios/infraestructura/recordatorio-schema";

export class RecordatorioRepositorioMongo implements IRecordatorioRepositorio {
  async buscarPorId(id: string): Promise<Recordatorio | null> {
    await conectarMongoDB();
    const doc = await RecordatorioModel.findById(id).lean();
    if (!doc) return null;
    return new Recordatorio({
      id: doc._id,
      profesorId: doc.profesorId,
      fecha: doc.fecha,
      titulo: doc.titulo,
      descripcion: doc.descripcion,
      tipo: doc.tipo,
      creadoEn: doc.creadoEn,
      actualizadoEn: doc.actualizadoEn,
    });
  }

  async listarPorProfesor(profesorId: string): Promise<Recordatorio[]> {
    await conectarMongoDB();
    const docs = await RecordatorioModel.find({ profesorId }).lean();
    return docs.map(
      (doc) =>
        new Recordatorio({
          id: doc._id,
          profesorId: doc.profesorId,
          fecha: doc.fecha,
          titulo: doc.titulo,
          descripcion: doc.descripcion,
          tipo: doc.tipo,
          creadoEn: doc.creadoEn,
          actualizadoEn: doc.actualizadoEn,
        })
    );
  }

  async crear(recordatorio: Recordatorio): Promise<void> {
    await conectarMongoDB();
    await RecordatorioModel.create({
      _id: recordatorio.id,
      profesorId: recordatorio.profesorId,
      fecha: recordatorio.fecha,
      titulo: recordatorio.titulo,
      descripcion: recordatorio.descripcion,
      tipo: recordatorio.tipo,
      creadoEn: recordatorio.creadoEn,
      actualizadoEn: recordatorio.actualizadoEn,
    });
  }

  async actualizar(recordatorio: Recordatorio): Promise<void> {
    await conectarMongoDB();
    await RecordatorioModel.findByIdAndUpdate(recordatorio.id, {
      fecha: recordatorio.fecha,
      titulo: recordatorio.titulo,
      descripcion: recordatorio.descripcion,
      tipo: recordatorio.tipo,
      actualizadoEn: recordatorio.actualizadoEn,
    });
  }

  async eliminar(id: string): Promise<void> {
    await conectarMongoDB();
    await RecordatorioModel.findByIdAndDelete(id);
  }
}
