import "dotenv/config";
import mongoose from "mongoose";
import { generarId } from "@/compartido/lib/uuid";
import { AreaModel } from "@/modulos/areas/infraestructura/area-schema";
import { CursoModel } from "@/modulos/cursos/infraestructura/curso-schema";
import { AsignacionModel } from "@/modulos/asignaciones/infraestructura/asignacion-schema";

/**
 * Migración puntual: en Secundaria, "Ciencia y Tecnología" se dictaba como un
 * solo curso genérico (igual que en Primaria). Se desglosa en Física, Química
 * y Biología -solo para Secundaria-, igual que ya existe para Matemática, y
 * se reasignan las 10 Asignaciones de Secundaria (verificadas antes, todas
 * bajo el mismo profesor) según el grado. Las Asignaciones conservan su _id,
 * así que BloqueHorario y Notas (que referencian asignacionId, no cursoId) no
 * necesitan tocarse.
 */
const ASIGNACION_A_CURSO_NUEVO: Record<string, "Física" | "Química" | "Biología"> = {
  "ASI-59B7CC90": "Biología", // 1°A
  "ASI-FB398A1D": "Biología", // 1°B
  "ASI-C29D87BC": "Biología", // 2°A
  "ASI-0A681449": "Biología", // 2°B
  "ASI-F78C82F6": "Química", // 3°A
  "ASI-368DE1CE": "Química", // 3°B
  "ASI-2B8D431E": "Física", // 4°A
  "ASI-0F201CF9": "Física", // 4°B
  "ASI-172F5CC9": "Física", // 5°A
  "ASI-22DA764B": "Física", // 5°B
};

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log("Conectado a MongoDB.");

  const area = await AreaModel.findOne({ nombre: "Ciencia y Tecnología" }).lean();
  if (!area) {
    console.error('No se encontró el área "Ciencia y Tecnología".');
    process.exit(1);
  }

  const ahora = new Date().toISOString();
  const cursoIdPorNombre = new Map<string, string>();

  for (const nombre of ["Física", "Química", "Biología"] as const) {
    const id = generarId("CUR");
    cursoIdPorNombre.set(nombre, id);
    await CursoModel.create({
      _id: id,
      nombre,
      descripcion: "Secundaria",
      areaId: area._id,
      activo: true,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });
    console.log(`Curso creado: ${nombre} (${id})`);
  }

  let actualizadas = 0;
  for (const [asignacionId, nombreCurso] of Object.entries(ASIGNACION_A_CURSO_NUEVO)) {
    const cursoId = cursoIdPorNombre.get(nombreCurso)!;
    const res = await AsignacionModel.findByIdAndUpdate(asignacionId, { cursoId });
    if (res) actualizadas++;
    else console.warn(`No se encontró la asignación ${asignacionId}.`);
  }

  console.log(`Asignaciones reasignadas: ${actualizadas}/${Object.keys(ASIGNACION_A_CURSO_NUEVO).length}.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
