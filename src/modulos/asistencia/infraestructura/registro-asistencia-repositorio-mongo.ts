import { conectarMongoDB } from "@/compartido/infraestructura/mongodb-client";
import { IRegistroAsistenciaRepositorio } from "@/modulos/asistencia/aplicacion/i-registro-asistencia-repositorio";
import { RegistroAsistencia } from "@/modulos/asistencia/dominio/registro-asistencia";
import { RegistroAsistenciaModel } from "@/modulos/asistencia/infraestructura/registro-asistencia-schema";

function aDominio(doc: {
  _id: string; sesionId: string; estudianteId: string; estado: string; bloqueado: boolean; creadoEn: string; actualizadoEn: string;
}): RegistroAsistencia {
  return new RegistroAsistencia({
    id: doc._id,
    sesionId: doc.sesionId,
    estudianteId: doc.estudianteId,
    estado: doc.estado as RegistroAsistencia["estado"],
    bloqueado: doc.bloqueado,
    creadoEn: doc.creadoEn,
    actualizadoEn: doc.actualizadoEn,
  });
}

export class RegistroAsistenciaRepositorioMongo implements IRegistroAsistenciaRepositorio {
  async buscarPorSesionYEstudiante(sesionId: string, estudianteId: string): Promise<RegistroAsistencia | null> {
    await conectarMongoDB();
    const doc = await RegistroAsistenciaModel.findOne({ sesionId, estudianteId }).lean();
    return doc ? aDominio(doc) : null;
  }

  async listarPorSesion(sesionId: string): Promise<RegistroAsistencia[]> {
    await conectarMongoDB();
    const docs = await RegistroAsistenciaModel.find({ sesionId }).lean();
    return docs.map(aDominio);
  }

  async crear(registro: RegistroAsistencia): Promise<void> {
    await conectarMongoDB();
    await RegistroAsistenciaModel.create({
      _id: registro.id,
      sesionId: registro.sesionId,
      estudianteId: registro.estudianteId,
      estado: registro.estado,
      bloqueado: registro.bloqueado,
      creadoEn: registro.creadoEn,
      actualizadoEn: registro.actualizadoEn,
    });
  }

  async actualizar(registro: RegistroAsistencia): Promise<void> {
    await conectarMongoDB();
    await RegistroAsistenciaModel.findByIdAndUpdate(registro.id, {
      estado: registro.estado,
      bloqueado: registro.bloqueado,
      actualizadoEn: registro.actualizadoEn,
    });
  }
}
