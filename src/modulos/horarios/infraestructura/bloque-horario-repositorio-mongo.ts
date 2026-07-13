import { conectarMongoDB } from "@/compartido/infraestructura/mongodb-client";
import { IBloqueHorarioRepositorio } from "@/modulos/horarios/aplicacion/i-bloque-horario-repositorio";
import { BloqueHorario } from "@/modulos/horarios/dominio/bloque-horario";
import { BloqueHorarioModel } from "@/modulos/horarios/infraestructura/bloque-horario-schema";

export class BloqueHorarioRepositorioMongo implements IBloqueHorarioRepositorio {
  async buscarPorId(id: string): Promise<BloqueHorario | null> {
    await conectarMongoDB();
    const doc = await BloqueHorarioModel.findById(id).lean();
    if (!doc) return null;
    return new BloqueHorario({
      id: doc._id,
      asignacionId: doc.asignacionId,
      profesorId: doc.profesorId,
      diaSemana: doc.diaSemana,
      horaInicio: doc.horaInicio,
      horaFin: doc.horaFin,
      creadoEn: doc.creadoEn,
      actualizadoEn: doc.actualizadoEn,
    });
  }

  async listarPorProfesor(profesorId: string): Promise<BloqueHorario[]> {
    await conectarMongoDB();
    const docs = await BloqueHorarioModel.find({ profesorId }).lean();
    return docs.map(
      (doc) =>
        new BloqueHorario({
          id: doc._id,
          asignacionId: doc.asignacionId,
          profesorId: doc.profesorId,
          diaSemana: doc.diaSemana,
          horaInicio: doc.horaInicio,
          horaFin: doc.horaFin,
          creadoEn: doc.creadoEn,
          actualizadoEn: doc.actualizadoEn,
        })
    );
  }

  async crear(bloque: BloqueHorario): Promise<void> {
    await conectarMongoDB();
    await BloqueHorarioModel.create({
      _id: bloque.id,
      asignacionId: bloque.asignacionId,
      profesorId: bloque.profesorId,
      diaSemana: bloque.diaSemana,
      horaInicio: bloque.horaInicio,
      horaFin: bloque.horaFin,
      creadoEn: bloque.creadoEn,
      actualizadoEn: bloque.actualizadoEn,
    });
  }

  async actualizar(bloque: BloqueHorario): Promise<void> {
    await conectarMongoDB();
    await BloqueHorarioModel.findByIdAndUpdate(bloque.id, {
      diaSemana: bloque.diaSemana,
      horaInicio: bloque.horaInicio,
      horaFin: bloque.horaFin,
      actualizadoEn: bloque.actualizadoEn,
    });
  }

  async eliminar(id: string): Promise<void> {
    await conectarMongoDB();
    await BloqueHorarioModel.findByIdAndDelete(id);
  }
}
