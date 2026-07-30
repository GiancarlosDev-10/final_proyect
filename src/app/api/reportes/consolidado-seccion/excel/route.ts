import { readFileSync } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
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
const FUENTE = "Arial";

const AZUL_ENCABEZADO = "FF1E293B";
const GRIS_FRANJA = "FFF8FAFC";
const BORDE_GRIS = "FFCBD5E1";
const VERDE_APROBADO = "FF059669";
const ROJO_DESAPROBADO = "FFA23B3B";

const BORDE_FINO = { style: "thin" as const, color: { argb: BORDE_GRIS } };
const BORDE_CELDA = { top: BORDE_FINO, left: BORDE_FINO, bottom: BORDE_FINO, right: BORDE_FINO };

// Conducta no existe como concepto real en el sistema todavía (no hay UI para
// cargarla) — se simula fija en 17 (A) para todos, para que el reporte se
// vea completo sin necesidad de un módulo nuevo.
const CONDUCTA_SIMULADA = 17;

// El consolidado junta TODOS los cursos de la sección (de cualquier
// profesor) — es la libreta completa del alumno, por eso es exclusivo del
// admin. El profesor tiene su propio reporte acotado a su curso en
// /api/reportes/notas-curso/excel.
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

  // "Tutor" no es un campo real de Sección todavía — se toma como el primer
  // profesor con una asignación activa en esta sección/periodo.
  const asignacionSeccion = todasAsignaciones.find(
    (a) => a.seccionId === seccionId && a.periodoId === periodoId && a.activo
  );
  const tutor = asignacionSeccion ? await usuarioRepositorio.buscarPorId(asignacionSeccion.profesorId) : null;

  const filasOrdenadas = [...consolidado.filas].sort((a, b) =>
    apellidoNombreReporte(nombreEstudiante(a.estudianteId)).localeCompare(apellidoNombreReporte(nombreEstudiante(b.estudianteId)), "es")
  );

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Dashboard Colegio";

  // Columnas: N°, Apellidos y Nombres, (Nota, Letra) × cada curso, (Nota, Letra) Conducta, Puntaje, Orden de Mérito.
  const NUM_CURSOS = consolidado.cursoIds.length;
  const colConductaNota = 3 + NUM_CURSOS * 2;
  const colConductaLetra = colConductaNota + 1;
  const colPuntaje = colConductaLetra + 1;
  const colOrden = colPuntaje + 1;
  const ultimaColumna = colOrden;

  const filaCursosHeader = 9;
  const filaColumnas = 10;

  const hoja = workbook.addWorksheet("Consolidado", {
    views: [{ state: "frozen", xSplit: 2, ySplit: filaColumnas }],
  });
  hoja.properties.defaultRowHeight = 15;

  hoja.mergeCells(1, 1, 1, ultimaColumna);
  const celdaTitulo = hoja.getCell(1, 1);
  celdaTitulo.value = "CONSOLIDADO DE NOTAS";
  celdaTitulo.font = { name: FUENTE, bold: true, size: 14 };
  celdaTitulo.alignment = { horizontal: "center", vertical: "middle" };
  hoja.getRow(1).height = 24;

  // La etiqueta se fusiona en columnas A+B (no solo A) para tener ancho de
  // sobra sin depender de qué tan angosta necesite ser la columna A para el
  // "N°" de la tabla de abajo — son la misma columna física, pero el merge
  // usa el ancho combinado de A+B, así ninguna de las dos necesita ser ancha
  // por sí sola.
  const COLUMNA_FIN_ETIQUETA = 2;
  function filaInfo(numeroFila: number, etiqueta: string, valor: string) {
    hoja.mergeCells(numeroFila, 1, numeroFila, COLUMNA_FIN_ETIQUETA);
    const celdaEtiqueta = hoja.getCell(numeroFila, 1);
    celdaEtiqueta.value = etiqueta;
    celdaEtiqueta.font = { name: FUENTE, bold: true };
    hoja.mergeCells(numeroFila, COLUMNA_FIN_ETIQUETA + 1, numeroFila, Math.max(COLUMNA_FIN_ETIQUETA + 1, ultimaColumna - 3));
    const celdaValor = hoja.getCell(numeroFila, COLUMNA_FIN_ETIQUETA + 1);
    celdaValor.value = valor;
    celdaValor.font = { name: FUENTE };
  }
  hoja.mergeCells(2, 1, 2, COLUMNA_FIN_ETIQUETA);
  const celdaDatosInfo = hoja.getCell(2, 1);
  celdaDatosInfo.value = "Datos Informativos";
  celdaDatosInfo.font = { name: FUENTE, bold: true, italic: true };
  filaInfo(3, "Institución Educativa", NOMBRE_COLEGIO);
  filaInfo(4, "Nivel Académico", ETIQUETAS_NIVEL_EDUCATIVO[seccion.nivel]);
  filaInfo(5, "Unidad", `Unidad ${ordenUnidad}`);
  filaInfo(6, "Grado", `${seccion.grado} ${seccion.nombre} de ${ETIQUETAS_NIVEL_EDUCATIVO[seccion.nivel]}`);
  filaInfo(7, "Tutor", tutor ? apellidoNombreReporte(tutor.nombreCompleto) : "—");

  // Logo del colegio, arriba a la derecha del bloque de datos informativos.
  try {
    const logoBuffer = readFileSync(path.join(process.cwd(), "src/assets/juanvelasco.png"));
    const imageId = workbook.addImage({ buffer: logoBuffer, extension: "png" } as unknown as ExcelJS.Image);
    hoja.addImage(imageId, {
      tl: { col: ultimaColumna - 2, row: 1 },
      ext: { width: 90, height: 90 },
    });
  } catch {
    // Sin logo no se rompe el reporte — es puramente decorativo.
  }

  // Encabezados que ocupan las dos filas de header (N°, Apellidos, Conducta,
  // Puntaje, Orden) via merge vertical; "CURSOS" ocupa el resto de la fila
  // superior, y cada curso tiene su propio par de columnas (Nota/Letra) en la
  // fila inferior, con el nombre del curso rotado 90° como en el modelo.
  function encabezadoVertical(columna: number, texto: string) {
    hoja.mergeCells(filaCursosHeader, columna, filaColumnas, columna);
    const celda = hoja.getCell(filaCursosHeader, columna);
    celda.value = texto;
    celda.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  }
  encabezadoVertical(1, "N°");
  encabezadoVertical(2, "Apellidos y Nombres");
  encabezadoVertical(colPuntaje, "Puntaje");
  encabezadoVertical(colOrden, "Orden de\nMérito");

  // Conducta tiene 2 columnas (nota/letra) igual que un curso, pero no
  // pertenece al bloque "CURSOS" — se muestra como un bloque propio de 2×2,
  // sin rotar, igual que N° y Apellidos y Nombres.
  hoja.mergeCells(filaCursosHeader, colConductaNota, filaColumnas, colConductaLetra);
  const celdaConducta = hoja.getCell(filaCursosHeader, colConductaNota);
  celdaConducta.value = "Conducta";
  celdaConducta.alignment = { horizontal: "center", vertical: "middle", wrapText: true };

  hoja.mergeCells(filaCursosHeader, 3, filaCursosHeader, 2 + NUM_CURSOS * 2);
  const celdaCursos = hoja.getCell(filaCursosHeader, 3);
  celdaCursos.value = "CURSOS";
  celdaCursos.alignment = { horizontal: "center", vertical: "middle" };

  consolidado.cursoIds.forEach((cursoId, indice) => {
    const columnaInicio = 3 + indice * 2;
    hoja.mergeCells(filaColumnas, columnaInicio, filaColumnas, columnaInicio + 1);
    const celda = hoja.getCell(filaColumnas, columnaInicio);
    celda.value = nombreCurso(cursoId);
    celda.alignment = { textRotation: 90, horizontal: "center", vertical: "middle", wrapText: true };
  });

  // Estilo (fondo azul, fuente blanca, bordes) sobre las dos filas de header completas.
  for (let fila = filaCursosHeader; fila <= filaColumnas; fila++) {
    for (let col = 1; col <= ultimaColumna; col++) {
      const celda = hoja.getCell(fila, col);
      celda.font = { name: FUENTE, bold: true, color: { argb: "FFFFFFFF" } };
      celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL_ENCABEZADO } };
      celda.border = BORDE_CELDA;
    }
  }
  hoja.getRow(filaCursosHeader).height = 20;
  hoja.getRow(filaColumnas).height = 90;

  filasOrdenadas.forEach((fila, indice) => {
    const numeroFila = filaColumnas + 1 + indice;
    const esFranjaGris = indice % 2 === 1;
    const letraConducta = letraDeNota(CONDUCTA_SIMULADA);

    function escribirCelda(columna: number, valor: string | number, opciones: { negrita?: boolean; color?: string } = {}) {
      const celda = hoja.getCell(numeroFila, columna);
      celda.value = valor;
      celda.border = BORDE_CELDA;
      celda.alignment = { horizontal: columna === 2 ? "left" : "center", vertical: "middle" };
      celda.font = { name: FUENTE, bold: opciones.negrita ?? false, color: opciones.color ? { argb: opciones.color } : undefined };
      if (esFranjaGris) {
        celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GRIS_FRANJA } };
      }
    }

    escribirCelda(1, indice + 1);
    escribirCelda(2, apellidoNombreReporte(nombreEstudiante(fila.estudianteId)));

    fila.notasPorCurso.forEach((n, i) => {
      const columnaNota = 3 + i * 2;
      const color = n.promedio === null ? undefined : n.promedio < 11 ? ROJO_DESAPROBADO : VERDE_APROBADO;
      escribirCelda(columnaNota, n.promedio ?? "—", { negrita: true, color });
      escribirCelda(columnaNota + 1, n.letra ?? "—", { negrita: true, color });
    });

    escribirCelda(colConductaNota, CONDUCTA_SIMULADA, { negrita: true, color: VERDE_APROBADO });
    escribirCelda(colConductaLetra, letraConducta ?? "—", { negrita: true, color: VERDE_APROBADO });

    escribirCelda(colPuntaje, fila.puntaje ?? "—", { negrita: true });
    escribirCelda(colOrden, fila.ordenMerito ?? "—", { negrita: true });
  });

  hoja.getColumn(1).width = 6;
  hoja.getColumn(2).width = 30;
  for (let i = 0; i < NUM_CURSOS * 2; i++) {
    hoja.getColumn(3 + i).width = 6;
  }
  hoja.getColumn(colConductaNota).width = 7;
  hoja.getColumn(colConductaLetra).width = 7;
  hoja.getColumn(colPuntaje).width = 12;
  hoja.getColumn(colOrden).width = 14;

  const buffer = await workbook.xlsx.writeBuffer();
  const nombreArchivo = `consolidado_${seccion.grado}${seccion.nombre}_${periodo.nombre}_U${ordenUnidad}.xlsx`.replace(/\s+/g, "_");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
    },
  });
}
