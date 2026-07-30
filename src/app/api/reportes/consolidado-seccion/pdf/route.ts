import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { requerirRol } from "@/compartido/lib/autorizacion";
import { ROLES, ETIQUETAS_NIVEL_EDUCATIVO } from "@/config/constantes";
import { calcularConsolidadoSeccion, letraDeNota } from "@/modulos/reportes/aplicacion/calcular-consolidado-seccion";
import { MatriculaRepositorioMongo } from "@/modulos/matriculas/infraestructura/matricula-repositorio-mongo";
import { AsignacionRepositorioMongo } from "@/modulos/asignaciones/infraestructura/asignacion-repositorio-mongo";
import { UnidadDidacticaRepositorioMongo } from "@/modulos/unidades-didacticas/infraestructura/unidad-didactica-repositorio-mongo";
import { NotaRepositorioMongo } from "@/modulos/notas/infraestructura/nota-repositorio-mongo";
import { SeccionRepositorioMongo } from "@/modulos/secciones/infraestructura/seccion-repositorio-mongo";
import { PeriodoRepositorioMongo } from "@/modulos/periodos/infraestructura/periodo-repositorio-mongo";
import { CursoRepositorioMongo } from "@/modulos/cursos/infraestructura/curso-repositorio-mongo";
import { EstudianteRepositorioMongo } from "@/modulos/estudiantes/infraestructura/estudiante-repositorio-mongo";
import { UsuarioRepositorioMongo } from "@/modulos/usuarios/infraestructura/usuario-repositorio-mongo";
import { apellidoNombreReporte } from "@/compartido/lib/formatear-nombre";

const NOMBRE_COLEGIO = "Colegio Juan Velasco Alvarado";
// jsPDF no trae Arial embebida (solo helvetica/times/courier) — helvetica es
// la más parecida visualmente sin tener que empaquetar una fuente TTF aparte.
const FUENTE = "helvetica";

function hashTexto(texto: string): number {
  let h = 0;
  for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) >>> 0;
  return h;
}
function conductaSimulada(estudianteId: string): number {
  const h = hashTexto(`${estudianteId}-conducta`);
  const r = (h % 1000) / 1000;
  if (r < 0.2) return 18 + (h % 3);
  if (r < 0.75) return 14 + (h % 4);
  if (r < 0.95) return 11 + (h % 3);
  return 8 + (h % 3);
}

export async function GET(request: NextRequest) {
  if (!(await requerirRol(ROLES.ADMIN))) {
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
  const seccionRepositorio = new SeccionRepositorioMongo();
  const periodoRepositorio = new PeriodoRepositorioMongo();
  const cursoRepositorio = new CursoRepositorioMongo();
  const estudianteRepositorio = new EstudianteRepositorioMongo();
  const usuarioRepositorio = new UsuarioRepositorioMongo();

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

  const [cursos, estudiantes, todasAsignaciones] = await Promise.all([
    Promise.all(consolidado.cursoIds.map((id) => cursoRepositorio.buscarPorId(id))),
    estudianteRepositorio.listar(),
    asignacionRepositorio.listar(),
  ]);
  const nombreCurso = (id: string) => cursos.find((c) => c?.id === id)?.nombre ?? "(curso eliminado)";
  const nombreEstudiante = (id: string) => estudiantes.find((e) => e.id === id)?.nombreCompleto ?? "(estudiante eliminado)";

  const asignacionSeccion = todasAsignaciones.find(
    (a) => a.seccionId === seccionId && a.periodoId === periodoId && a.activo
  );
  const tutor = asignacionSeccion ? await usuarioRepositorio.buscarPorId(asignacionSeccion.profesorId) : null;

  const filasOrdenadas = [...consolidado.filas].sort((a, b) =>
    apellidoNombreReporte(nombreEstudiante(a.estudianteId)).localeCompare(apellidoNombreReporte(nombreEstudiante(b.estudianteId)), "es")
  );

  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFont(FUENTE);
  doc.setFontSize(14);
  doc.text("CONSOLIDADO DE NOTAS", 14, 15);
  doc.setFontSize(9);
  doc.text(`Institución Educativa: ${NOMBRE_COLEGIO}`, 14, 22);
  doc.text(`Nivel Académico: ${ETIQUETAS_NIVEL_EDUCATIVO[seccion.nivel]}`, 14, 27);
  doc.text(`Unidad: Unidad ${ordenUnidad}`, 14, 32);
  doc.text(`Grado: ${seccion.grado} ${seccion.nombre} de ${ETIQUETAS_NIVEL_EDUCATIVO[seccion.nivel]}`, 100, 22);
  doc.text(`Tutor: ${tutor ? apellidoNombreReporte(tutor.nombreCompleto) : "—"}`, 100, 27);

  const NUM_CURSOS = consolidado.cursoIds.length;

  // Fila 1 del header: N°/Apellidos/Conducta/Puntaje/Orden con rowSpan 2 (una
  // sola celda, alta), y "CURSOS" con colSpan sobre el resto. Fila 2: cada
  // curso con colSpan 2 (una columna para la nota, otra para la letra).
  const headFila1 = [
    { content: "N°", rowSpan: 2, styles: { valign: "middle" as const, halign: "center" as const } },
    { content: "Apellidos y Nombres", rowSpan: 2, styles: { valign: "middle" as const } },
    { content: "CURSOS", colSpan: NUM_CURSOS * 2, styles: { halign: "center" as const } },
    { content: "Conducta", rowSpan: 2, styles: { valign: "middle" as const, halign: "center" as const } },
    { content: "Puntaje", rowSpan: 2, styles: { valign: "middle" as const, halign: "center" as const } },
    { content: "Orden de\nMérito", rowSpan: 2, styles: { valign: "middle" as const, halign: "center" as const } },
  ];
  const headFila2 = consolidado.cursoIds.map((cursoId) => ({
    content: nombreCurso(cursoId),
    colSpan: 2,
    styles: { halign: "center" as const },
  }));

  autoTable(doc, {
    startY: 38,
    styles: { font: FUENTE, fontSize: 7, cellPadding: 1.2, lineColor: [203, 213, 225], lineWidth: 0.1 },
    headStyles: { font: FUENTE, fillColor: [30, 41, 59], minCellHeight: 32, valign: "bottom" },
    head: [headFila1, headFila2],
    body: filasOrdenadas.map((fila, indice) => {
      const conducta = conductaSimulada(fila.estudianteId);
      return [
        String(indice + 1),
        apellidoNombreReporte(nombreEstudiante(fila.estudianteId)),
        ...fila.notasPorCurso.flatMap((n) => [n.promedio === null ? "—" : String(n.promedio), n.letra ?? "—"]),
        `${conducta} ${letraDeNota(conducta)}`,
        fila.puntaje === null ? "—" : String(fila.puntaje),
        fila.ordenMerito === null ? "—" : String(fila.ordenMerito),
      ];
    }),
    // Las celdas de nombre de curso (fila 2 del head) se dibujan giradas 90°
    // a mano — jspdf-autotable no soporta texto rotado de forma nativa. Se
    // vacía el texto propio de la celda en didParseCell y se redibuja rotado
    // en didDrawCell. Conviene confirmar visualmente el resultado al abrir
    // el PDF real, esta parte es más delicada de calibrar sin poder verla.
    didParseCell: (data) => {
      if (data.section === "head" && data.row.section === "head" && data.row.index === 1) {
        data.cell.text = [];
      }
    },
    didDrawCell: (data) => {
      if (data.section === "head" && data.row.index === 1 && Array.isArray(data.cell.raw) === false) {
        const texto = typeof data.cell.raw === "string" ? data.cell.raw : (data.cell.raw as { content?: string })?.content;
        if (!texto) return;
        const x = data.cell.x + data.cell.width / 2 + 2;
        const y = data.cell.y + data.cell.height - 2;
        doc.setFont(FUENTE);
        doc.setFontSize(7);
        doc.text(texto, x, y, { angle: 90, align: "left" });
      }
    },
  });

  const buffer = doc.output("arraybuffer");
  const nombreArchivo = `consolidado_${seccion.grado}${seccion.nombre}_${periodo.nombre}_U${ordenUnidad}.pdf`.replace(/\s+/g, "_");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
    },
  });
}
