import "dotenv/config";
import mongoose from "mongoose";
import { generarId } from "@/compartido/lib/uuid";
import { AsignacionModel } from "@/modulos/asignaciones/infraestructura/asignacion-schema";
import { UnidadDidacticaModel } from "@/modulos/unidades-didacticas/infraestructura/unidad-didactica-schema";
import { MatriculaModel } from "@/modulos/matriculas/infraestructura/matricula-schema";
import { NotaModel } from "@/modulos/notas/infraestructura/nota-schema";

/**
 * Borra y vuelve a sembrar las notas de UN profesor puntual (para la demo:
 * José Cortez Camacho / Comunicación), ahora con las 4 notas siempre
 * presentes por alumno y unidad (antes salían 2-3 al azar, lo que se veía
 * como una inconsistencia en el reporte de "notas por curso" del profesor).
 * No toca las notas de ningún otro profesor/asignación.
 */
const PROFESOR_ID = "USR-0002";

const TIPOS_ETIQUETAS: Array<{ tipo: "PRACTICA" | "EXAMEN" | "TRABAJO" | "PARTICIPACION"; etiquetas: string[] }> = [
  { tipo: "PRACTICA", etiquetas: ["Práctica 1", "Práctica 2", "Práctica calificada"] },
  { tipo: "EXAMEN", etiquetas: ["Examen parcial", "Examen de unidad"] },
  { tipo: "TRABAJO", etiquetas: ["Trabajo grupal", "Trabajo de investigación"] },
  { tipo: "PARTICIPACION", etiquetas: ["Participación en clase"] },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function notaRealista(): number {
  const r = Math.random();
  if (r < 0.15) return randomInt(18, 20);
  if (r < 0.7) return randomInt(14, 17);
  if (r < 0.95) return randomInt(11, 13);
  return randomInt(5, 10);
}

function fechaAleatoriaEnRango(inicio: string, fin: string): string {
  const t1 = new Date(inicio).getTime();
  const t2 = new Date(fin).getTime();
  const t = t1 + Math.random() * Math.max(0, t2 - t1);
  return new Date(t).toISOString().slice(0, 10);
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log("Conectado a MongoDB.");

  const asignaciones = await AsignacionModel.find({ profesorId: PROFESOR_ID, activo: true }).lean();
  console.log(`Asignaciones activas del profesor: ${asignaciones.length}.`);
  const asignacionIds = asignaciones.map((a) => a._id);

  const borrado = await NotaModel.deleteMany({ asignacionId: { $in: asignacionIds } });
  console.log(`Notas anteriores borradas: ${borrado.deletedCount}.`);

  const notasDocs: Array<{
    _id: string;
    estudianteId: string;
    asignacionId: string;
    periodoId: string;
    unidadDidacticaId: string;
    tipo: string;
    etiqueta: string;
    valor: number;
    fecha: string;
    creadoEn: string;
    actualizadoEn: string;
  }> = [];
  const ahora = new Date().toISOString();

  for (const asignacion of asignaciones) {
    const unidades = await UnidadDidacticaModel.find({ cursoId: asignacion.cursoId, periodoId: asignacion.periodoId }).lean();
    const matriculas = await MatriculaModel.find({ seccionId: asignacion.seccionId, activo: true }).lean();

    for (const estudianteId of matriculas.map((m) => m.estudianteId)) {
      for (const unidad of unidades) {
        for (const { tipo, etiquetas } of TIPOS_ETIQUETAS) {
          notasDocs.push({
            _id: generarId("NOT"),
            estudianteId,
            asignacionId: asignacion._id,
            periodoId: asignacion.periodoId,
            unidadDidacticaId: unidad._id,
            tipo,
            etiqueta: pick(etiquetas),
            valor: notaRealista(),
            fecha: fechaAleatoriaEnRango(unidad.fechaInicio, unidad.fechaFin),
            creadoEn: ahora,
            actualizadoEn: ahora,
          });
        }
      }
    }
  }

  console.log(`Generando ${notasDocs.length} notas nuevas (4 por alumno y unidad)...`);
  await NotaModel.insertMany(notasDocs);
  console.log("Listo.");

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
