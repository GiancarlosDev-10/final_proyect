import mongoose, { Schema } from "mongoose";
import { Rol } from "@/config/constantes";

export interface IUsuarioDocument {
  _id: string;
  email: string;
  passwordHash: string;
  rol: Rol;
  nombreCompleto: string;
  activo: boolean;
  pinTelegramHash?: string;
  notasPersonales?: string;
  creadoEn: string;
  actualizadoEn: string;
}

const UsuarioSchema = new Schema<IUsuarioDocument>(
  {
    _id: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    rol: { type: String, enum: ["ADMIN", "PROFESOR"], required: true },
    nombreCompleto: { type: String, required: true },
    activo: { type: Boolean, default: true },
    pinTelegramHash: { type: String },
    notasPersonales: { type: String },
    creadoEn: { type: String, required: true },
    actualizadoEn: { type: String, required: true },
  },
  { _id: false }
);

export const UsuarioModel =
  mongoose.models.Usuario ||
  mongoose.model<IUsuarioDocument>("Usuario", UsuarioSchema, "usuarios");