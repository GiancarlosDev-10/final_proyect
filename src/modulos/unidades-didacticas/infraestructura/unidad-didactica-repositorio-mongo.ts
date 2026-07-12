import { conectarMongoDB } from "@/compartido/infraestructura/mongodb-client";
import { IUnidadDidacticaRepositorio } from "@/modulos/unidades-didacticas/aplicacion/i-unidad-didactica-repositorio";
import { UnidadDidactica } from "@/modulos/unidades-didacticas/dominio/unidad-didactica";
import { UnidadDidacticaModel } from "@/modulos/unidades-didacticas/infraestructura/unidad-didactica-schema";

export class UnidadDidacticaRepositorioMongo implements IUnidadDidacticaRepositorio {
  async buscarPorId(id: string): Promise<UnidadDidactica | null> {
    await conectarMongoDB();
    const doc = await UnidadDidacticaModel.findById(id).lean();
    if (!doc) return null;
    return new UnidadDidactica({
      id: doc._id,
      nombre: doc.nombre,
      periodoId: doc.periodoId,
      estado: doc.estado,
      creadoEn: doc.creadoEn,
      actualizadoEn: doc.actualizadoEn,
    });
  }

  async listar(): Promise<UnidadDidactica[]> {
    await conectarMongoDB();
    const docs = await UnidadDidacticaModel.find().lean();
    return docs.map(
      (doc) =>
        new UnidadDidactica({
          id: doc._id,
          nombre: doc.nombre,
          periodoId: doc.periodoId,
          estado: doc.estado,
          creadoEn: doc.creadoEn,
          actualizadoEn: doc.actualizadoEn,
        })
    );
  }

  async listarPorPeriodo(periodoId: string): Promise<UnidadDidactica[]> {
    await conectarMongoDB();
    const docs = await UnidadDidacticaModel.find({ periodoId }).lean();
    return docs.map(
      (doc) =>
        new UnidadDidactica({
          id: doc._id,
          nombre: doc.nombre,
          periodoId: doc.periodoId,
          estado: doc.estado,
          creadoEn: doc.creadoEn,
          actualizadoEn: doc.actualizadoEn,
        })
    );
  }

  async crear(unidadDidactica: UnidadDidactica): Promise<void> {
    await conectarMongoDB();
    await UnidadDidacticaModel.create({
      _id: unidadDidactica.id,
      nombre: unidadDidactica.nombre,
      periodoId: unidadDidactica.periodoId,
      estado: unidadDidactica.estado,
      creadoEn: unidadDidactica.creadoEn,
      actualizadoEn: unidadDidactica.actualizadoEn,
    });
  }

  async actualizar(unidadDidactica: UnidadDidactica): Promise<void> {
    await conectarMongoDB();
    await UnidadDidacticaModel.findByIdAndUpdate(unidadDidactica.id, {
      nombre: unidadDidactica.nombre,
      periodoId: unidadDidactica.periodoId,
      estado: unidadDidactica.estado,
      actualizadoEn: unidadDidactica.actualizadoEn,
    });
  }

  async eliminar(id: string): Promise<void> {
    await conectarMongoDB();
    await UnidadDidacticaModel.findByIdAndDelete(id);
  }
}
