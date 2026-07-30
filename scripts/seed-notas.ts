import "dotenv/config";
import mongoose from "mongoose";
import { generarId } from "@/compartido/lib/uuid";
import { PeriodoModel } from "@/modulos/periodos/infraestructura/periodo-schema";
import { AsignacionModel } from "@/modulos/asignaciones/infraestructura/asignacion-schema";
import { UnidadDidacticaModel } from "@/modulos/unidades-didacticas/infraestructura/unidad-didactica-schema";
import { MatriculaModel } from "@/modulos/matriculas/infraestructura/matricula-schema";
import { NotaModel } from "@/modulos/notas/infraestructura/nota-schema";

/**
 * Siembra notas realistas para el periodo ABIERTO, una por cada combinación
 * (estudiante matriculado × asignación × unidad didáctica del curso), para
 * TODAS las asignaciones activas del colegio — así cualquier sección que se
 * quiera mostrar en el consolidado (Excel/PDF) sale completa, no solo la de
 * la demo. Es ADITIVO e IDEMPOTENTE por asignación: no borra ni recrea
 * estudiantes/asignaciones/periodos (corre contra la misma base de Atlas que
 * usa producción, con vínculos reales de Telegram), y salta cualquier
 * asignación que ya tenga notas cargadas, así se puede correr de nuevo sin
 * duplicar lo que ya se generó antes (ej. Comunicación).
 */

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

/** Distribución con más peso en el rango "A" (14-17), como una clase real. */
function notaRealista(): number {
  const r = Math.random();
  if (r < 0.15) return randomInt(18, 20); // AD
  if (r < 0.7) return randomInt(14, 17); // A
  if (r < 0.95) return randomInt(11, 13); // B
  return randomInt(5, 10); // C
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

  const periodo = await PeriodoModel.findOne({ estado: "ABIERTO" }).lean();
  if (!periodo) {
    console.log("No hay ningún periodo ABIERTO. Nada que sembrar.");
    process.exit(0);
  }
  console.log(`Periodo abierto: ${periodo.nombre} (${periodo._id}).`);

  const asignaciones = await AsignacionModel.find({ activo: true, periodoId: periodo._id }).lean();
  console.log(`Asignaciones activas en este periodo: ${asignaciones.length}.`);

  const asignacionesConNotas = new Set(
    (await NotaModel.distinct("asignacionId", { periodoId: periodo._id })) as string[]
  );
  const asignacionesPendientes = asignaciones.filter((a) => !asignacionesConNotas.has(a._id));
  console.log(
    `Asignaciones que ya tenían notas (se saltan): ${asignaciones.length - asignacionesPendientes.length}. ` +
      `Pendientes de sembrar: ${asignacionesPendientes.length}.`
  );

  const unidadesTodas = await UnidadDidacticaModel.find({ periodoId: periodo._id }).lean();
  const unidadesPorCurso = new Map<string, typeof unidadesTodas>();
  for (const u of unidadesTodas) {
    unidadesPorCurso.set(u.cursoId, [...(unidadesPorCurso.get(u.cursoId) ?? []), u]);
  }

  const matriculasPorSeccion = new Map<string, string[]>();
  async function estudiantesDeSeccion(seccionId: string): Promise<string[]> {
    if (matriculasPorSeccion.has(seccionId)) return matriculasPorSeccion.get(seccionId)!;
    const matriculas = await MatriculaModel.find({ seccionId, activo: true, anio: periodo.anio }).lean();
    const ids = matriculas.map((m) => m.estudianteId);
    matriculasPorSeccion.set(seccionId, ids);
    return ids;
  }

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

  for (const asignacion of asignacionesPendientes) {
    const unidades = unidadesPorCurso.get(asignacion.cursoId) ?? [];
    if (unidades.length === 0) continue;

    const estudianteIds = await estudiantesDeSeccion(asignacion.seccionId);
    if (estudianteIds.length === 0) continue;

    for (const estudianteId of estudianteIds) {
      for (const unidad of unidades) {
        // Las 4, siempre — el consolidado del profesor muestra una columna
        // por tipo, y que a unos alumnos les falte alguno se ve como un
        // error de carga en vez de una clase real.
        for (const { tipo, etiquetas } of TIPOS_ETIQUETAS) {
          notasDocs.push({
            _id: generarId("NOT"),
            estudianteId,
            asignacionId: asignacion._id,
            periodoId: periodo._id,
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

  console.log(`Generando ${notasDocs.length} notas...`);
  const TAMANO_LOTE = 2000;
  for (let i = 0; i < notasDocs.length; i += TAMANO_LOTE) {
    await NotaModel.insertMany(notasDocs.slice(i, i + TAMANO_LOTE));
    console.log(`  ${Math.min(i + TAMANO_LOTE, notasDocs.length)}/${notasDocs.length}`);
  }

  console.log("Listo.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
