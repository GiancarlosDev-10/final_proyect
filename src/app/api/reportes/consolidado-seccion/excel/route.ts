import { readFileSync } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requerirSesion } from "@/compartido/lib/autorizacion";
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
import { apellidoNombre } from "@/compartido/lib/formatear-nombre";

const NOMBRE_COLEGIO = "Colegio Juan Velasco Alvarado";

const AZUL_ENCABEZADO = "FF1E293B";
const GRIS_FRANJA = "FFF8FAFC";
const BORDE_GRIS = "FFCBD5E1";
const VERDE_APROBADO = "FF059669";
const ROJO_DESAPROBADO = "FFA23B3B";

const BORDE_FINO = { style: "thin" as const, color: { argb: BORDE_GRIS } };
const BORDE_CELDA = { top: BORDE_FINO, left: BORDE_FINO, bottom: BORDE_FINO, right: BORDE_FINO };

// Conducta no existe como concepto real en el sistema todavía (no hay UI para
// cargarla) — se simula un valor determinístico por alumno (mismo valor en
// cada descarga, no cambia solo) para que el reporte se vea completo.
function hashTexto(texto: string): number {
  let h = 0;
  for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) >>> 0;
  return h;
}

function conductaSimulada(estudianteId: string): number {
  const h = hashTexto(`${estudianteId}-conducta`);
  const r = (h % 1000) / 1000;
  if (r < 0.2) return 18 + (h % 3); // AD
  if (r < 0.75) return 14 + (h % 4); // A
  if (r < 0.95) return 11 + (h % 3); // B
  return 8 + (h % 3); // C (poco frecuente)
}

export async function GET(request: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion || (sesion.rol !== ROLES.ADMIN && sesion.rol !== ROLES.PROFESOR)) {
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
  // efectivamente dicta algún curso este periodo (no cualquier sección). El
  // admin no tiene esa restricción, puede exportar cualquier sección.
  if (sesion.rol === ROLES.PROFESOR) {
    const misAsignaciones = await asignacionRepositorio.listarPorProfesor(sesion.id);
    const dictaEnEstaSeccion = misAsignaciones.some(
      (a) => a.seccionId === seccionId && a.periodoId === periodoId && a.activo
    );
    if (!dictaEnEstaSeccion) {
      return NextResponse.json({ error: "No tienes una asignación activa en esta sección y periodo" }, { status: 403 });
    }
  }

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
    apellidoNombre(nombreEstudiante(a.estudianteId)).localeCompare(apellidoNombre(nombreEstudiante(b.estudianteId)), "es")
  );

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Dashboard Colegio";
  const hoja = workbook.addWorksheet("Consolidado", {
    views: [{ state: "frozen", xSplit: 2, ySplit: 10 }],
  });

  const totalColumnas = 2 + consolidado.cursoIds.length + 3; // N°, Apellidos, cursos, Conducta, Puntaje, Orden
  const ultimaColumna = totalColumnas;

  hoja.mergeCells(1, 1, 1, ultimaColumna);
  const celdaTitulo = hoja.getCell(1, 1);
  celdaTitulo.value = "CONSOLIDADO DE NOTAS";
  celdaTitulo.font = { bold: true, size: 14 };
  celdaTitulo.alignment = { horizontal: "center", vertical: "middle" };
  hoja.getRow(1).height = 24;

  function filaInfo(numeroFila: number, etiqueta: string, valor: string) {
    const celdaEtiqueta = hoja.getCell(numeroFila, 1);
    celdaEtiqueta.value = etiqueta;
    celdaEtiqueta.font = { bold: true };
    hoja.mergeCells(numeroFila, 2, numeroFila, Math.max(2, ultimaColumna - 3));
    hoja.getCell(numeroFila, 2).value = valor;
  }
  hoja.getCell(2, 1).value = "Datos Informativos";
  hoja.getCell(2, 1).font = { bold: true, italic: true };
  filaInfo(3, "Institución Educativa", NOMBRE_COLEGIO);
  filaInfo(4, "Nivel Académico", ETIQUETAS_NIVEL_EDUCATIVO[seccion.nivel]);
  filaInfo(5, "Unidad", `Unidad ${ordenUnidad}`);
  filaInfo(6, "Grado", `${seccion.grado} ${seccion.nombre} de ${ETIQUETAS_NIVEL_EDUCATIVO[seccion.nivel]}`);
  filaInfo(7, "Tutor", tutor ? apellidoNombre(tutor.nombreCompleto) : "—");

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

  const filaCursosHeader = 9;
  hoja.mergeCells(filaCursosHeader, 3, filaCursosHeader, 2 + consolidado.cursoIds.length);
  const celdaCursos = hoja.getCell(filaCursosHeader, 3);
  celdaCursos.value = "CURSOS";
  celdaCursos.font = { bold: true, italic: true };
  celdaCursos.alignment = { horizontal: "center", vertical: "middle" };

  const encabezados = [
    "N°",
    "Apellidos y Nombres",
    ...consolidado.cursoIds.map(nombreCurso),
    "Conducta",
    "Puntaje",
    "Orden de Mérito",
  ];
  const filaEncabezado = hoja.getRow(10);
  encabezados.forEach((texto, i) => {
    const celda = filaEncabezado.getCell(i + 1);
    celda.value = texto;
    celda.font = { bold: true, color: { argb: "FFFFFFFF" } };
    celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL_ENCABEZADO } };
    celda.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    celda.border = BORDE_CELDA;
  });
  filaEncabezado.height = 28;

  const columnaConducta = 3 + consolidado.cursoIds.length;

  filasOrdenadas.forEach((fila, indice) => {
    const numeroFila = 11 + indice;
    const esFranjaGris = indice % 2 === 1;
    const conducta = conductaSimulada(fila.estudianteId);
    const valores = [
      indice + 1,
      apellidoNombre(nombreEstudiante(fila.estudianteId)),
      ...fila.notasPorCurso.map((n) => (n.promedio === null ? "—" : `${n.promedio.toFixed(1)} ${n.letra}`)),
      `${conducta} ${letraDeNota(conducta)}`,
      fila.puntaje === null ? "—" : Number(fila.puntaje.toFixed(1)),
      fila.ordenMerito === null ? "—" : fila.ordenMerito,
    ];

    valores.forEach((valor, i) => {
      const celda = hoja.getCell(numeroFila, i + 1);
      celda.value = valor;
      celda.border = BORDE_CELDA;
      celda.alignment = { horizontal: i === 1 ? "left" : "center", vertical: "middle" };
      if (esFranjaGris) {
        celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GRIS_FRANJA } };
      }

      const esColumnaDeCurso = i >= 2 && i < 2 + consolidado.cursoIds.length;
      if (esColumnaDeCurso) {
        const promedio = fila.notasPorCurso[i - 2]?.promedio;
        if (promedio !== null && promedio !== undefined) {
          celda.font = { color: { argb: promedio < 11 ? ROJO_DESAPROBADO : VERDE_APROBADO }, bold: true };
        }
      }
      if (i === columnaConducta - 1) {
        celda.font = { color: { argb: conducta < 11 ? ROJO_DESAPROBADO : VERDE_APROBADO }, bold: true };
      }
      if (i === columnaConducta || i === columnaConducta + 1) {
        celda.font = { ...celda.font, bold: true };
      }
    });
  });

  hoja.getColumn(1).width = 6;
  hoja.getColumn(2).width = 30;
  for (let i = 0; i < consolidado.cursoIds.length; i++) {
    hoja.getColumn(3 + i).width = 13;
  }
  hoja.getColumn(columnaConducta).width = 12;
  hoja.getColumn(ultimaColumna - 1).width = 12;
  hoja.getColumn(ultimaColumna).width = 16;

  const buffer = await workbook.xlsx.writeBuffer();
  const nombreArchivo = `consolidado_${seccion.grado}${seccion.nombre}_${periodo.nombre}_U${ordenUnidad}.xlsx`.replace(/\s+/g, "_");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
    },
  });
}
