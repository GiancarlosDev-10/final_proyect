import { conectarMongoDB } from "@/compartido/infraestructura/mongodb-client";
import { IUnidadDidacticaRepositorio } from "@/modulos/unidades-didacticas/aplicacion/i-unidad-didactica-repositorio";
import { UnidadDidactica } from "@/modulos/unidades-didacticas/dominio/unidad-didactica";
import { UnidadDidacticaModel, IUnidadDidacticaDocument } from "@/modulos/unidades-didacticas/infraestructura/unidad-didactica-schema";

function aDominio(doc: IUnidadDidacticaDocument): UnidadDidactica {
  return new UnidadDidactica({
    id: doc._id,
    nombre: doc.nombre,
    cursoId: doc.cursoId,
    periodoId: doc.periodoId,
    orden: doc.orden,
    fechaInicio: doc.fechaInicio,
    fechaFin: doc.fechaFin,
    estado: doc.estado,
    creadoEn: doc.creadoEn,
    actualizadoEn: doc.actualizadoEn,
  });
}

export class UnidadDidacticaRepositorioMongo implements IUnidadDidacticaRepositorio {
  async buscarPorId(id: string): Promise<UnidadDidactica | null> {
    await conectarMongoDB();
    const doc = await UnidadDidacticaModel.findById(id).lean();
    if (!doc) return null;
    return aDominio(doc);
  }

  async listar(): Promise<UnidadDidactica[]> {
    await conectarMongoDB();
    const docs = await UnidadDidacticaModel.find().lean();
    return docs.map(aDominio);
  }

  async listarPorPeriodo(periodoId: string): Promise<UnidadDidactica[]> {
    await conectarMongoDB();
    const docs = await UnidadDidacticaModel.find({ periodoId }).lean();
    return docs.map(aDominio);
  }

  async listarPorCursoYPeriodo(cursoId: string, periodoId: string): Promise<UnidadDidactica[]> {
    await conectarMongoDB();
    const docs = await UnidadDidacticaModel.find({ cursoId, periodoId }).sort({ orden: 1 }).lean();
    return docs.map(aDominio);
  }

  async crear(unidadDidactica: UnidadDidactica): Promise<void> {
    await conectarMongoDB();
    await UnidadDidacticaModel.create({
      _id: unidadDidactica.id,
      nombre: unidadDidactica.nombre,
      cursoId: unidadDidactica.cursoId,
      periodoId: unidadDidactica.periodoId,
      orden: unidadDidactica.orden,
      fechaInicio: unidadDidactica.fechaInicio,
      fechaFin: unidadDidactica.fechaFin,
      estado: unidadDidactica.estado,
      creadoEn: unidadDidactica.creadoEn,
      actualizadoEn: unidadDidactica.actualizadoEn,
    });
  }

  async actualizar(unidadDidactica: UnidadDidactica): Promise<void> {
    await conectarMongoDB();
    await UnidadDidacticaModel.findByIdAndUpdate(unidadDidactica.id, {
      nombre: unidadDidactica.nombre,
      cursoId: unidadDidactica.cursoId,
      periodoId: unidadDidactica.periodoId,
      orden: unidadDidactica.orden,
      fechaInicio: unidadDidactica.fechaInicio,
      fechaFin: unidadDidactica.fechaFin,
      estado: unidadDidactica.estado,
      actualizadoEn: unidadDidactica.actualizadoEn,
    });
  }

  async eliminar(id: string): Promise<void> {
    await conectarMongoDB();
    await UnidadDidacticaModel.findByIdAndDelete(id);
  }
}
