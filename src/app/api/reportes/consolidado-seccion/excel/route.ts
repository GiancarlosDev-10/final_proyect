import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requerirRol } from "@/compartido/lib/autorizacion";
import { ROLES } from "@/config/constantes";
import { calcularConsolidadoSeccion } from "@/modulos/reportes/aplicacion/calcular-consolidado-seccion";
import { MatriculaRepositorioMongo } from "@/modulos/matriculas/infraestructura/matricula-repositorio-mongo";
import { AsignacionRepositorioMongo } from "@/modulos/asignaciones/infraestructura/asignacion-repositorio-mongo";
import { UnidadDidacticaRepositorioMongo } from "@/modulos/unidades-didacticas/infraestructura/unidad-didactica-repositorio-mongo";
import { NotaRepositorioMongo } from "@/modulos/notas/infraestructura/nota-repositorio-mongo";
import { SeccionRepositorioMongo } from "@/modulos/secciones/infraestructura/seccion-repositorio-mongo";
import { PeriodoRepositorioMongo } from "@/modulos/periodos/infraestructura/periodo-repositorio-mongo";
import { CursoRepositorioMongo } from "@/modulos/cursos/infraestructura/curso-repositorio-mongo";
import { EstudianteRepositorioMongo } from "@/modulos/estudiantes/infraestructura/estudiante-repositorio-mongo";
import { apellidoNombre } from "@/compartido/lib/formatear-nombre";

export async function GET(request: NextRequest) {
  const profesorId = await requerirRol(ROLES.PROFESOR);
  if (!profesorId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const seccionId = searchParams.get("seccionId");
  const periodoId = searchParams.get("periodoId");
  const ordenUnidad = Number(searchParams.get("ordenUnidad"));

  if (!seccionId || !periodoId || (ordenUnidad !== 1 && ordenUnidad !== 2)) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const asignacionRepositorio = new AsignacionRepositorioMongo();
  // Un profesor solo puede exportar el consolidado de una sección donde
  // efectivamente dicta algún curso este periodo (no cualquier sección).
  const misAsignaciones = await asignacionRepositorio.listarPorProfesor(profesorId);
  const dictaEnEstaSeccion = misAsignaciones.some(
    (a) => a.seccionId === seccionId && a.periodoId === periodoId && a.activo
  );
  if (!dictaEnEstaSeccion) {
    return NextResponse.json({ error: "No tienes una asignación activa en esta sección y periodo" }, { status: 403 });
  }

  const seccionRepositorio = new SeccionRepositorioMongo();
  const periodoRepositorio = new PeriodoRepositorioMongo();
  const cursoRepositorio = new CursoRepositorioMongo();
  const estudianteRepositorio = new EstudianteRepositorioMongo();

  const [seccion, periodo] = await Promise.all([
    seccionRepositorio.buscarPorId(seccionId),
    periodoRepositorio.buscarPorId(periodoId),
  ]);
  if (!seccion || !periodo) {
    return NextResponse.json({ error: "Sección o periodo no encontrado" }, { status: 404 });
  }

  const resultado = await calcularConsolidadoSeccion(
    { seccionId, periodoId, anio: periodo.anio, ordenUnidad },
    {
      matriculaRepositorio: new MatriculaRepositorioMongo(),
      asignacionRepositorio,
      unidadDidacticaRepositorio: new UnidadDidacticaRepositorioMongo(),
      notaRepositorio: new NotaRepositorioMongo(),
    }
  );
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error.message }, { status: 500 });
  }
  const consolidado = resultado.value;

  const [cursos, estudiantes] = await Promise.all([
    Promise.all(consolidado.cursoIds.map((id) => cursoRepositorio.buscarPorId(id))),
    estudianteRepositorio.listar(),
  ]);
  const nombreCurso = (id: string) => cursos.find((c) => c?.id === id)?.nombre ?? "(curso eliminado)";
  const nombreEstudiante = (id: string) => estudiantes.find((e) => e.id === id)?.nombreCompleto ?? "(estudiante eliminado)";

  const filasOrdenadas = [...consolidado.filas].sort((a, b) =>
    apellidoNombre(nombreEstudiante(a.estudianteId)).localeCompare(apellidoNombre(nombreEstudiante(b.estudianteId)), "es")
  );

  const workbook = new ExcelJS.Workbook();
  const hoja = workbook.addWorksheet("Consolidado");

  hoja.addRow([`Sección: ${seccion.grado} ${seccion.nombre}`]);
  hoja.addRow([`Periodo: ${periodo.nombre} ${periodo.anio} — Unidad ${ordenUnidad}`]);
  hoja.addRow([]);

  const filaEncabezado = hoja.addRow(["N°", "Apellidos y Nombres", ...consolidado.cursoIds.map(nombreCurso), "Puntaje", "Orden de Mérito"]);
  filaEncabezado.font = { bold: true };
  filaEncabezado.eachCell((celda) => {
    celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
    celda.font = { bold: true, color: { argb: "FFFFFFFF" } };
  });

  filasOrdenadas.forEach((fila, indice) => {
    hoja.addRow([
      indice + 1,
      apellidoNombre(nombreEstudiante(fila.estudianteId)),
      ...fila.notasPorCurso.map((n) => (n.promedio === null ? "—" : `${n.promedio.toFixed(1)} ${n.letra}`)),
      fila.puntaje === null ? "—" : Number(fila.puntaje.toFixed(1)),
      fila.ordenMerito === null ? "—" : fila.ordenMerito,
    ]);
  });

  hoja.columns.forEach((columna, indice) => {
    columna.width = indice === 1 ? 28 : 14;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const nombreArchivo = `consolidado_${seccion.grado}${seccion.nombre}_${periodo.nombre}_U${ordenUnidad}.xlsx`.replace(/\s+/g, "_");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
    },
  });
}
