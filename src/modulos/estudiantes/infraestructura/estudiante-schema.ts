import mongoose, { Schema } from "mongoose";

export interface IEstudianteDocument {
  _id: string;
  documento: string;
  nombreCompleto: string;
  fechaNacimiento: string;
  apoderado: {
    nombre: string;
    telefono: string;
    parentesco: string;
  };
  activo: boolean;
  fotoBase64: string | null;
  fotoContentType: string | null;
  encodingFacial: number[] | null;
  encodingActualizadoEn: string | null;
  creadoEn: string;
  actualizadoEn: string;
}

const EstudianteSchema = new Schema<IEstudianteDocument>(
  {
    _id: { type: String, required: true },
    documento: { type: String, required: true, unique: true },
    nombreCompleto: { type: String, required: true },
    fechaNacimiento: { type: String, required: true },
    apoderado: {
      nombre: { type: String, required: true },
      telefono: { type: String, required: true },
      parentesco: { type: String, required: true },
    },
    activo: { type: Boolean, default: true },
    fotoBase64: { type: String, default: null },
    fotoContentType: { type: String, default: null },
    encodingFacial: { type: [Number], default: null },
    encodingActualizadoEn: { type: String, default: null },
    creadoEn: { type: String, required: true },
    actualizadoEn: { type: String, required: true },
  },
  { _id: false }
);

export const EstudianteModel =
  mongoose.models.Estudiante ||
  mongoose.model<IEstudianteDocument>("Estudiante", EstudianteSchema, "estudiantes");