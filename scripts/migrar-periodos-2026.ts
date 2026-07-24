import "dotenv/config";
import mongoose from "mongoose";
import { PeriodoModel } from "@/modulos/periodos/infraestructura/periodo-schema";
import { PeriodoRepositorioMongo } from "@/modulos/periodos/infraestructura/periodo-repositorio-mongo";
import { generarPeriodosAnio } from "@/modulos/periodos/aplicacion/generar-periodos-anio";
import { AsignacionModel } from "@/modulos/asignaciones/infraestructura/asignacion-schema";
import { NotaModel } from "@/modulos/notas/infraestructura/nota-schema";
import { UnidadDidacticaModel } from "@/modulos/unidades-didacticas/infraestructura/unidad-didactica-schema";

const ANIO = 2026;

/**
 * Migración puntual: reemplaza el periodo semilla "Año Escolar 2026" (creado
 * por seed-datos-escolares.ts como un solo bloque de todo el año) por los 4
 * periodos reales del calendario, y reapunta las Asignaciones, Notas y
 * Unidades Didácticas que ya referenciaban el periodo semilla hacia el nuevo
 * periodo que quede ABIERTO. No toca Estudiantes, Usuarios ni Matrículas.
 */
async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log("Conectado a MongoDB.");

  const periodosExistentes = await PeriodoModel.find({ anio: ANIO }).lean();
  if (periodosExistentes.length === 0) {
    console.log(`No hay periodos para el año ${ANIO}. Nada que migrar.`);
    process.exit(0);
  }

  const idsAntiguos = periodosExistentes.map((p) => p._id);
  console.log(`Periodos antiguos encontrados: ${idsAntiguos.join(", ")}`);

  await PeriodoModel.deleteMany({ anio: ANIO });
  console.log("Periodos antiguos eliminados.");

  const repositorio = new PeriodoRepositorioMongo();
  const resultado = await generarPeriodosAnio({ anio: ANIO }, repositorio);
  if (!resultado.ok) {
    console.error("No se pudieron generar los nuevos periodos:", resultado.error.message);
    process.exit(1);
  }

  const periodoDestino = resultado.value.find((p) => p.estaAbierto()) ?? resultado.value[0];
  console.log(
    `Nuevos periodos creados: ${resultado.value.map((p) => `${p.nombre} (${p.estado})`).join(", ")}.`
  );
  console.log(`Periodo destino para las referencias antiguas: ${periodoDestino.nombre} (${periodoDestino.id}).`);

  const filtro = { periodoId: { $in: idsAntiguos } };
  const [asignaciones, notas, unidades] = await Promise.all([
    AsignacionModel.updateMany(filtro, { periodoId: periodoDestino.id }),
    NotaModel.updateMany(filtro, { periodoId: periodoDestino.id }),
    UnidadDidacticaModel.updateMany(filtro, { periodoId: periodoDestino.id }),
  ]);

  console.log(`Asignaciones actualizadas: ${asignaciones.modifiedCount}`);
  console.log(`Notas actualizadas: ${notas.modifiedCount}`);
  console.log(`Unidades didácticas actualizadas: ${unidades.modifiedCount}`);

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
