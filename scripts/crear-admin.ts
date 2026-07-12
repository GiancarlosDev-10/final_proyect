import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UsuarioSchema = new mongoose.Schema(
  {
    _id: String,
    email: String,
    passwordHash: String,
    rol: String,
    nombreCompleto: String,
    activo: Boolean,
    creadoEn: String,
    actualizadoEn: String,
  },
  { _id: false }
);

const UsuarioModel =
  mongoose.models.Usuario || mongoose.model("Usuario", UsuarioSchema, "usuarios");

async function crearAdmin() {
  await mongoose.connect(process.env.MONGODB_URI!);

  const passwordHash = await bcrypt.hash("Admin#2026!", 10);
  const ahora = new Date().toISOString();

  await UsuarioModel.create({
    _id: "USR-0001",
    email: "admin@colegio.edu.pe",
    passwordHash,
    rol: "ADMIN",
    nombreCompleto: "Administrador General",
    activo: true,
    creadoEn: ahora,
    actualizadoEn: ahora,
  });

  await mongoose.disconnect();
}

crearAdmin().catch(console.error);