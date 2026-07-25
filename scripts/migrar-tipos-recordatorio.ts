import "dotenv/config";
import mongoose from "mongoose";
import { RecordatorioModel } from "@/modulos/recordatorios/infraestructura/recordatorio-schema";

/**
 * Migración puntual: los tipos "Reunión con padre/profesor/director" se
 * unifican en un solo "Reunión" (el detalle de con quién ya va en el
 * título/descripción); se agregan Evaluación, Entrega y Tarea aparte.
 */
async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log("Conectado a MongoDB.");

  const resultado = await RecordatorioModel.collection.updateMany(
    { tipo: { $in: ["REUNION_PADRE", "REUNION_PROFESOR", "REUNION_DIRECTOR"] } },
    { $set: { tipo: "REUNION" } }
  );
  console.log(`Recordatorios migrados a "REUNION": ${resultado.modifiedCount}.`);

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
