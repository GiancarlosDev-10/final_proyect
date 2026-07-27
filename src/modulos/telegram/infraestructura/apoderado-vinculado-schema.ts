import mongoose, { Schema } from "mongoose";

export interface IApoderadoVinculadoDocument {
  _id: string;
  chatId: string;
  estudianteId: string;
  creadoEn: string;
}

const ApoderadoVinculadoSchema = new Schema<IApoderadoVinculadoDocument>(
  {
    _id: { type: String, required: true },
    chatId: { type: String, required: true },
    estudianteId: { type: String, required: true },
    creadoEn: { type: String, required: true },
  },
  { _id: false }
);

// Un mismo chat no puede vincularse dos veces al mismo estudiante.
ApoderadoVinculadoSchema.index({ chatId: 1, estudianteId: 1 }, { unique: true });
ApoderadoVinculadoSchema.index({ estudianteId: 1 });

export const ApoderadoVinculadoModel =
  mongoose.models.ApoderadoVinculado ||
  mongoose.model<IApoderadoVinculadoDocument>("ApoderadoVinculado", ApoderadoVinculadoSchema, "telegram_apoderados");
