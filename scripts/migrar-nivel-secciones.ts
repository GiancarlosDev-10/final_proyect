import "dotenv/config";
import mongoose from "mongoose";
import { SeccionModel } from "@/modulos/secciones/infraestructura/seccion-schema";
import { MatriculaModel } from "@/modulos/matriculas/infraestructura/matricula-schema";
import { EstudianteModel } from "@/modulos/estudiantes/infraestructura/estudiante-schema";

/**
 * Backfill único: las secciones sembradas antes de que `Seccion` tuviera el
 * campo `nivel` no distinguen Primaria de Secundaria (ambas reusan grados
 * "1°".."5°"). Inferimos el nivel:
 * - "años" en el grado -> INICIAL (inequívoco).
 * - grado "6°" -> PRIMARIA (Secundaria no llega a 6°, inequívoco).
 * - "1°".."5°" -> ambiguo por texto; se resuelve mirando la edad real de un
 *   alumno matriculado, ya que el seed generó edades distintas a propósito
 *   (Primaria 1°=6 años, Secundaria 1°=12 años, etc.).
 */
async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log("Conectado a MongoDB.");

  const secciones = await SeccionModel.find({ nivel: { $exists: false } }).lean();
  if (secciones.length === 0) {
    console.log("No hay secciones sin nivel. Nada que migrar.");
    process.exit(0);
  }

  let inicial = 0;
  let primaria = 0;
  let secundaria = 0;
  const sinResolver: string[] = [];

  for (const seccion of secciones) {
    let nivel: "INICIAL" | "PRIMARIA" | "SECUNDARIA" | null = null;

    if (seccion.grado.includes("años")) {
      nivel = "INICIAL";
    } else if (seccion.grado === "6°") {
      nivel = "PRIMARIA";
    } else {
      const gradoNum = Number(seccion.grado.replace("°", ""));
      const matricula = await MatriculaModel.findOne({ seccionId: seccion._id }).lean();
      const estudiante = matricula ? await EstudianteModel.findById(matricula.estudianteId).lean() : null;

      if (estudiante) {
        const anioNacimiento = Number(estudiante.fechaNacimiento.split("-")[0]);
        const edad = seccion.anio - anioNacimiento;
        const edadPrimariaEsperada = 5 + gradoNum;
        const edadSecundariaEsperada = 11 + gradoNum;
        nivel =
          Math.abs(edad - edadPrimariaEsperada) <= Math.abs(edad - edadSecundariaEsperada) ? "PRIMARIA" : "SECUNDARIA";
      }
    }

    if (!nivel) {
      sinResolver.push(`${seccion._id} (${seccion.grado} ${seccion.nombre})`);
      continue;
    }

    await SeccionModel.findByIdAndUpdate(seccion._id, { nivel });
    if (nivel === "INICIAL") inicial++;
    else if (nivel === "PRIMARIA") primaria++;
    else secundaria++;
  }

  console.log(`Migradas: ${inicial} Inicial, ${primaria} Primaria, ${secundaria} Secundaria.`);
  if (sinResolver.length > 0) {
    console.log("No se pudo inferir el nivel de (sin matrícula/estudiante para comparar edad):");
    console.log(sinResolver.join("\n"));
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
