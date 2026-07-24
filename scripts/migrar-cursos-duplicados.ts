import "dotenv/config";
import mongoose from "mongoose";
import { CursoModel } from "@/modulos/cursos/infraestructura/curso-schema";
import { AsignacionModel } from "@/modulos/asignaciones/infraestructura/asignacion-schema";
import { UnidadDidacticaModel } from "@/modulos/unidades-didacticas/infraestructura/unidad-didactica-schema";

interface Fusion {
  mantener: string;
  eliminar: string;
  descripcion: string;
  materia: string;
}

/**
 * Migración puntual: el seed original creaba un curso por nivel aunque fuera
 * la misma materia (ej. "Comunicación" en Primaria y otro "Comunicación" en
 * Secundaria), duplicando 6 materias. Se fusiona cada par en el curso que ya
 * cubre más niveles (verificado contando Asignaciones: 6=Inicial, 12=Primaria,
 * 10=Secundaria, 18=Inicial+Primaria) y se reasignan sus referencias.
 */
const FUSIONES: Fusion[] = [
  { materia: "Arte y Cultura", mantener: "CUR-50624CF8", eliminar: "CUR-D6B81446", descripcion: "Primaria y Secundaria" },
  { materia: "Ciencia y Tecnología", mantener: "CUR-6EC0CB03", eliminar: "CUR-1F372547", descripcion: "Primaria y Secundaria" },
  { materia: "Comunicación", mantener: "CUR-3DCE0FA8", eliminar: "CUR-64BA4532", descripcion: "Inicial, Primaria y Secundaria" },
  { materia: "Educación Física", mantener: "CUR-9B242A59", eliminar: "CUR-D70F9200", descripcion: "Primaria y Secundaria" },
  { materia: "Educación Religiosa", mantener: "CUR-793BD4A1", eliminar: "CUR-707F2DF2", descripcion: "Primaria y Secundaria" },
  { materia: "Inglés", mantener: "CUR-C8490088", eliminar: "CUR-C905E669", descripcion: "Primaria y Secundaria" },
];

const DESCRIPCIONES_SIMPLES: Record<string, string> = {
  "CUR-3AE6D219": "Secundaria", // Aritmética
  "CUR-AFA76A81": "Secundaria", // Ciencias Sociales
  "CUR-824C1FB3": "Secundaria", // Desarrollo Personal, Ciudadanía y Cívica
  "CUR-40F01AA0": "Inicial", // Descubrimos el Mundo Natural y Cultural
  "CUR-44294554": "Secundaria", // Educación para el Trabajo
  "CUR-69C92344": "Secundaria", // Geometría
  "CUR-D5D0BEA4": "Inicial y Primaria", // Matemática
  "CUR-1D863B0F": "Inicial y Primaria", // Personal Social
  "CUR-D035FBD3": "Inicial", // Psicomotriz
  "CUR-1BBF6ABF": "Secundaria", // Trigonometría
  "CUR-F1C478E1": "Secundaria", // Álgebra
};

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log("Conectado a MongoDB.");

  for (const fusion of FUSIONES) {
    const filtro = { cursoId: fusion.eliminar };
    const [asignaciones, unidades] = await Promise.all([
      AsignacionModel.updateMany(filtro, { cursoId: fusion.mantener }),
      UnidadDidacticaModel.updateMany(filtro, { cursoId: fusion.mantener }),
    ]);
    await CursoModel.findByIdAndUpdate(fusion.mantener, { $set: { descripcion: fusion.descripcion } });
    await CursoModel.findByIdAndDelete(fusion.eliminar);
    console.log(
      `${fusion.materia}: fusionado ${fusion.eliminar} -> ${fusion.mantener} ` +
        `(asignaciones=${asignaciones.modifiedCount}, unidades=${unidades.modifiedCount})`
    );
  }

  for (const [id, descripcion] of Object.entries(DESCRIPCIONES_SIMPLES)) {
    await CursoModel.findByIdAndUpdate(id, { $set: { descripcion } });
  }
  console.log(`Descripciones actualizadas en ${Object.keys(DESCRIPCIONES_SIMPLES).length} cursos sin duplicado.`);

  const totalCursos = await CursoModel.countDocuments();
  console.log(`Total de cursos tras la migración: ${totalCursos}.`);

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
