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

const AZUL_ENCABEZADO = "FF1E293B";
const GRIS_FRANJA = "FFF8FAFC";
const BORDE_GRIS = "FFCBD5E1";
const VERDE_APROBADO = "FF059669";
const ROJO_DESAPROBADO = "FFA23B3B";

const BORDE_FINO = { style: "thin" as const, color: { argb: BORDE_GRIS } };
const BORDE_CELDA = { top: BORDE_FINO, left: BORDE_FINO, bottom: BORDE_FINO, right: BORDE_FINO };

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
  workbook.creator = "Dashboard Colegio";
  const hoja = workbook.addWorksheet("Consolidado", {
    views: [{ state: "frozen", xSplit: 2, ySplit: 6 }],
  });

  const totalColumnas = 2 + consolidado.cursoIds.length + 2;
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
    hoja.mergeCells(numeroFila, 2, numeroFila, ultimaColumna);
    hoja.getCell(numeroFila, 2).value = valor;
  }
  filaInfo(2, "Sección", `${seccion.grado} ${seccion.nombre}`);
  filaInfo(3, "Periodo", `${periodo.nombre} ${periodo.anio}`);
  filaInfo(4, "Unidad", `Unidad ${ordenUnidad}`);

  const encabezados = ["N°", "Apellidos y Nombres", ...consolidado.cursoIds.map(nombreCurso), "Puntaje", "Orden de Mérito"];
  const filaEncabezado = hoja.getRow(6);
  encabezados.forEach((texto, i) => {
    const celda = filaEncabezado.getCell(i + 1);
    celda.value = texto;
    celda.font = { bold: true, color: { argb: "FFFFFFFF" } };
    celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL_ENCABEZADO } };
    celda.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    celda.border = BORDE_CELDA;
  });
  filaEncabezado.height = 28;

  filasOrdenadas.forEach((fila, indice) => {
    const numeroFila = 7 + indice;
    const esFranjaGris = indice % 2 === 1;
    const valores = [
      indice + 1,
      apellidoNombre(nombreEstudiante(fila.estudianteId)),
      ...fila.notasPorCurso.map((n) => (n.promedio === null ? "—" : `${n.promedio.toFixed(1)} ${n.letra}`)),
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
          celda.font = { color: { argb: promedio >= 11 ? VERDE_APROBADO : ROJO_DESAPROBADO }, bold: true };
        }
      }
      if (i === 2 + consolidado.cursoIds.length) {
        celda.font = { ...celda.font, bold: true };
      }
    });
  });

  hoja.getColumn(1).width = 6;
  hoja.getColumn(2).width = 30;
  for (let i = 0; i < consolidado.cursoIds.length; i++) {
    hoja.getColumn(3 + i).width = 13;
  }
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
