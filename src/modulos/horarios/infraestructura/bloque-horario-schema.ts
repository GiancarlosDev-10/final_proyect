import mongoose, { Schema } from "mongoose";
import { DiaSemana } from "@/config/constantes";

export interface IBloqueHorarioDocument {
  _id: string;
  asignacionId: string;
  profesorId: string;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
  creadoEn: string;
  actualizadoEn: string;
}

const BloqueHorarioSchema = new Schema<IBloqueHorarioDocument>(
  {
    _id: { type: String, required: true },
    asignacionId: { type: String, required: true },
    profesorId: { type: String, required: true },
    diaSemana: {
      type: String,
      enum: ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES"],
      required: true,
    },
    horaInicio: { type: String, required: true },
    horaFin: { type: String, required: true },
    creadoEn: { type: String, required: true },
    actualizadoEn: { type: String, required: true },
  },
  { _id: false }
);

BloqueHorarioSchema.index({ profesorId: 1 });

export const BloqueHorarioModel =
  mongoose.models.BloqueHorario ||
  mongoose.model<IBloqueHorarioDocument>("BloqueHorario", BloqueHorarioSchema, "bloques_horario");
