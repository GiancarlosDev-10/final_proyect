import "dotenv/config";
import mongoose from "mongoose";
import { SeccionModel } from "@/modulos/secciones/infraestructura/seccion-schema";

/**
 * Migración puntual: Seccion ya no declara el campo `anio` (era redundante
 * con el año que ya vive en Periodo). Esto limpia el campo huérfano que
 * quedó en los documentos existentes; no afecta ninguna lógica, Mongoose ya
 * lo ignora al leer.
 *
 * Usa la colección nativa (no el Model) porque en modo strict (default de
 * Mongoose) un $unset sobre un path que ya no está en el schema se descarta
 * silenciosamente y el updateMany del Model termina siendo un no-op.
 */
async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log("Conectado a MongoDB.");

  const resultado = await SeccionModel.collection.updateMany({}, { $unset: { anio: "" } });
  console.log(`Secciones limpiadas: ${resultado.modifiedCount}.`);

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
