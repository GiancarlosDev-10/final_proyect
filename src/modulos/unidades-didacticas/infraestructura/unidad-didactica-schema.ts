import mongoose, { Schema } from "mongoose";
import { EstadoUnidadDidactica } from "@/config/constantes";

export interface IUnidadDidacticaDocument {
  _id: string;
  nombre: string;
  periodoId: string;
  estado: EstadoUnidadDidactica;
  creadoEn: string;
  actualizadoEn: string;
}

const UnidadDidacticaSchema = new Schema<IUnidadDidacticaDocument>(
  {
    _id: { type: String, required: true },
    nombre: { type: String, required: true },
    periodoId: { type: String, required: true },
    estado: { type: String, enum: ["ABIERTO", "CERRADO"], required: true },
    creadoEn: { type: String, required: true },
    actualizadoEn: { type: String, required: true },
  },
  { _id: false }
);

UnidadDidacticaSchema.index({ periodoId: 1 });

export const UnidadDidacticaModel =
  mongoose.models.UnidadDidactica ||
  mongoose.model<IUnidadDidacticaDocument>("UnidadDidactica", UnidadDidacticaSchema, "unidades_didacticas");
