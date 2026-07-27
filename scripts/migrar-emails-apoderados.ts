import "dotenv/config";
import mongoose from "mongoose";
import { EstudianteModel } from "@/modulos/estudiantes/infraestructura/estudiante-schema";

function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim()
    .replace(/\s+/g, ".");
}

/**
 * Migración puntual: rellena apoderado.email con un correo ficticio
 * (@ejemplo.com, no @colegio.edu.pe) para los estudiantes que ya existían
 * antes de agregar el campo — necesario para que el flujo de vinculación de
 * Telegram del apoderado tenga un valor con qué trabajar. El admin edita a
 * mano el de un alumno puntual a un correo real para probar el envío del
 * código de verificación.
 */
async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log("Conectado a MongoDB.");

  const estudiantes = await EstudianteModel.find({
    $or: [{ "apoderado.email": { $exists: false } }, { "apoderado.email": "" }],
  }).lean();

  console.log(`Estudiantes sin email de apoderado: ${estudiantes.length}.`);

  const emailsUsados = new Set<string>();
  let migrados = 0;

  for (const estudiante of estudiantes) {
    const base = slugify(estudiante.apoderado.nombre) || "apoderado";
    let email = `${base}@ejemplo.com`;
    let i = 2;
    while (emailsUsados.has(email)) {
      email = `${base}${i}@ejemplo.com`;
      i++;
    }
    emailsUsados.add(email);

    await EstudianteModel.updateOne({ _id: estudiante._id }, { $set: { "apoderado.email": email } });
    migrados++;
  }

  console.log(`Emails ficticios asignados: ${migrados}.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
