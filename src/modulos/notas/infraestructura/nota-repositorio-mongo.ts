import { conectarMongoDB } from "@/compartido/infraestructura/mongodb-client";
import { INotaRepositorio } from "@/modulos/notas/aplicacion/i-nota-repositorio";
import { Nota } from "@/modulos/notas/dominio/nota";
import { NotaModel } from "@/modulos/notas/infraestructura/nota-schema";

export class NotaRepositorioMongo implements INotaRepositorio {
  async buscarPorId(id: string): Promise<Nota | null> {
    await conectarMongoDB();
    const doc = await NotaModel.findById(id).lean();
    if (!doc) return null;
    return new Nota({
      id: doc._id,
      estudianteId: doc.estudianteId,
      asignacionId: doc.asignacionId,
      periodoId: doc.periodoId,
      unidadDidacticaId: doc.unidadDidacticaId,
      tipo: doc.tipo,
      etiqueta: doc.etiqueta,
      valor: doc.valor,
      fecha: doc.fecha,
      creadoEn: doc.creadoEn,
      actualizadoEn: doc.actualizadoEn,
    });
  }

  async listarPorAsignacion(asignacionId: string): Promise<Nota[]> {
    await conectarMongoDB();
    const docs = await NotaModel.find({ asignacionId }).lean();
    return docs.map((doc) => new Nota({
      id: doc._id,
      estudianteId: doc.estudianteId,
      asignacionId: doc.asignacionId,
      periodoId: doc.periodoId,
      unidadDidacticaId: doc.unidadDidacticaId,
      tipo: doc.tipo,
      etiqueta: doc.etiqueta,
      valor: doc.valor,
      fecha: doc.fecha,
      creadoEn: doc.creadoEn,
      actualizadoEn: doc.actualizadoEn,
    }));
  }

  async listarPorAsignaciones(asignacionIds: string[]): Promise<Nota[]> {
    await conectarMongoDB();
    if (asignacionIds.length === 0) return [];
    const docs = await NotaModel.find({ asignacionId: { $in: asignacionIds } }).lean();
    return docs.map((doc) => new Nota({
      id: doc._id,
      estudianteId: doc.estudianteId,
      asignacionId: doc.asignacionId,
      periodoId: doc.periodoId,
      unidadDidacticaId: doc.unidadDidacticaId,
      tipo: doc.tipo,
      etiqueta: doc.etiqueta,
      valor: doc.valor,
      fecha: doc.fecha,
      creadoEn: doc.creadoEn,
      actualizadoEn: doc.actualizadoEn,
    }));
  }

  async listarPorEstudiante(estudianteId: string): Promise<Nota[]> {
    await conectarMongoDB();
    const docs = await NotaModel.find({ estudianteId }).lean();
    return docs.map((doc) => new Nota({
      id: doc._id,
      estudianteId: doc.estudianteId,
      asignacionId: doc.asignacionId,
      periodoId: doc.periodoId,
      unidadDidacticaId: doc.unidadDidacticaId,
      tipo: doc.tipo,
      etiqueta: doc.etiqueta,
      valor: doc.valor,
      fecha: doc.fecha,
      creadoEn: doc.creadoEn,
      actualizadoEn: doc.actualizadoEn,
    }));
  }

  async listarPorPeriodo(periodoId: string): Promise<Nota[]> {
    await conectarMongoDB();
    const docs = await NotaModel.find({ periodoId }).lean();
    return docs.map((doc) => new Nota({
      id: doc._id,
      estudianteId: doc.estudianteId,
      asignacionId: doc.asignacionId,
      periodoId: doc.periodoId,
      unidadDidacticaId: doc.unidadDidacticaId,
      tipo: doc.tipo,
      etiqueta: doc.etiqueta,
      valor: doc.valor,
      fecha: doc.fecha,
      creadoEn: doc.creadoEn,
      actualizadoEn: doc.actualizadoEn,
    }));
  }

  async crear(nota: Nota): Promise<void> {
    await conectarMongoDB();
    await NotaModel.create({
      _id: nota.id,
      estudianteId: nota.estudianteId,
      asignacionId: nota.asignacionId,
      periodoId: nota.periodoId,
      unidadDidacticaId: nota.unidadDidacticaId,
      tipo: nota.tipo,
      etiqueta: nota.etiqueta,
      valor: nota.valor,
      fecha: nota.fecha,
      creadoEn: nota.creadoEn,
      actualizadoEn: nota.actualizadoEn,
    });
  }

  async actualizar(nota: Nota): Promise<void> {
    await conectarMongoDB();
    await NotaModel.findByIdAndUpdate(nota.id, {
      tipo: nota.tipo,
      etiqueta: nota.etiqueta,
      valor: nota.valor,
      fecha: nota.fecha,
      actualizadoEn: nota.actualizadoEn,
    });
  }

  async eliminar(id: string): Promise<void> {
    await conectarMongoDB();
    await NotaModel.findByIdAndDelete(id);
  }
}