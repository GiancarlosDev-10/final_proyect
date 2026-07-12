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

async function actualizarPassword() {
  const [, , email, password] = process.argv;
  if (!email || !password) {
    console.error("Uso: tsx --env-file=.env.local scripts/actualizar-password.ts <email> <password>");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI!);

  const passwordHash = await bcrypt.hash(password, 10);
  const resultado = await UsuarioModel.updateOne(
    { email },
    { $set: { passwordHash, actualizadoEn: new Date().toISOString() } }
  );

  if (resultado.matchedCount === 0) {
    console.log(`No se encontró ningún usuario con el email "${email}".`);
  } else {
    console.log(`Contraseña actualizada para ${email}.`);
  }

  await mongoose.disconnect();
}

actualizarPassword().catch(console.error);
