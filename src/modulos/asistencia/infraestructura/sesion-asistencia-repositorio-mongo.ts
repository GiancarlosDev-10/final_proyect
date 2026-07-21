import { conectarMongoDB } from "@/compartido/infraestructura/mongodb-client";
import { ISesionAsistenciaRepositorio } from "@/modulos/asistencia/aplicacion/i-sesion-asistencia-repositorio";
import { SesionAsistencia } from "@/modulos/asistencia/dominio/sesion-asistencia";
import { SesionAsistenciaModel } from "@/modulos/asistencia/infraestructura/sesion-asistencia-schema";

function aDominio(doc: {
  _id: string; bloqueHorarioId: string; fecha: string; horaEntrada: string; horaLimiteTardanza: string; horaCierre: string; creadoEn: string; actualizadoEn: string;
}): SesionAsistencia {
  return new SesionAsistencia({
    id: doc._id,
    bloqueHorarioId: doc.bloqueHorarioId,
    fecha: doc.fecha,
    horaEntrada: doc.horaEntrada,
    horaLimiteTardanza: doc.horaLimiteTardanza,
    horaCierre: doc.horaCierre,
    creadoEn: doc.creadoEn,
    actualizadoEn: doc.actualizadoEn,
  });
}

export class SesionAsistenciaRepositorioMongo implements ISesionAsistenciaRepositorio {
  async buscarPorId(id: string): Promise<SesionAsistencia | null> {
    await conectarMongoDB();
    const doc = await SesionAsistenciaModel.findById(id).lean();
    return doc ? aDominio(doc) : null;
  }

  async buscarPorBloqueYFecha(bloqueHorarioId: string, fecha: string): Promise<SesionAsistencia | null> {
    await conectarMongoDB();
    const doc = await SesionAsistenciaModel.findOne({ bloqueHorarioId, fecha }).lean();
    return doc ? aDominio(doc) : null;
  }

  async crear(sesion: SesionAsistencia): Promise<void> {
    await conectarMongoDB();
    await SesionAsistenciaModel.create({
      _id: sesion.id,
      bloqueHorarioId: sesion.bloqueHorarioId,
      fecha: sesion.fecha,
      horaEntrada: sesion.horaEntrada,
      horaLimiteTardanza: sesion.horaLimiteTardanza,
      horaCierre: sesion.horaCierre,
      creadoEn: sesion.creadoEn,
      actualizadoEn: sesion.actualizadoEn,
    });
  }

  async actualizar(sesion: SesionAsistencia): Promise<void> {
    await conectarMongoDB();
    await SesionAsistenciaModel.findByIdAndUpdate(sesion.id, {
      horaEntrada: sesion.horaEntrada,
      horaLimiteTardanza: sesion.horaLimiteTardanza,
      horaCierre: sesion.horaCierre,
      actualizadoEn: sesion.actualizadoEn,
    });
  }
}
