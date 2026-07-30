import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requerirRol } from "@/compartido/lib/autorizacion";
import { ROLES, TIPOS_NOTA } from "@/config/constantes";
import { calcularNotasCurso } from "@/modulos/reportes/aplicacion/calcular-notas-curso";
import { MatriculaRepositorioMongo } from "@/modulos/matriculas/infraestructura/matricula-repositorio-mongo";
import { AsignacionRepositorioMongo } from "@/modulos/asignaciones/infraestructura/asignacion-repositorio-mongo";
import { UnidadDidacticaRepositorioMongo } from "@/modulos/unidades-didacticas/infraestructura/unidad-didactica-repositorio-mongo";
import { NotaRepositorioMongo } from "@/modulos/notas/infraestructura/nota-repositorio-mongo";
import { SeccionRepositorioMongo } from "@/modulos/secciones/infraestructura/seccion-repositorio-mongo";
import { PeriodoRepositorioMongo } from "@/modulos/periodos/infraestructura/periodo-repositorio-mongo";
import { CursoRepositorioMongo } from "@/modulos/cursos/infraestructura/curso-repositorio-mongo";
import { EstudianteRepositorioMongo } from "@/modulos/estudiantes/infraestructura/estudiante-repositorio-mongo";
import { apellidoNombreReporte } from "@/compartido/lib/formatear-nombre";

const FUENTE = "Arial";
const AZUL_ENCABEZADO = "FF1E293B";
const GRIS_FRANJA = "FFF8FAFC";
const BORDE_GRIS = "FFCBD5E1";
const VERDE_APROBADO = "FF059669";
const ROJO_DESAPROBADO = "FFA23B3B";
const BORDE_FINO = { style: "thin" as const, color: { argb: BORDE_GRIS } };
const BORDE_CELDA = { top: BORDE_FINO, left: BORDE_FINO, bottom: BORDE_FINO, right: BORDE_FINO };

const ETIQUETAS_TIPO: Record<string, string> = {
  PRACTICA: "Práctica",
  EXAMEN: "Examen",
  TRABAJO: "Trabajo",
  PARTICIPACION: "Participación",
};

// Este reporte es del profesor: solo SU curso puntual (una asignación), a
// diferencia del consolidado de sección (todos los cursos, exclusivo del
// admin) — ver la nota en consolidado-seccion/excel/route.ts.
export async function GET(request: NextRequest) {
  const profesorId = await requerirRol(ROLES.PROFESOR);
  if (!profesorId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const asignacionId = searchParams.get("asignacionId");
  const ordenUnidad = Number(searchParams.get("ordenUnidad"));

  if (!asignacionId || (ordenUnidad !== 1 && ordenUnidad !== 2)) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const asignacionRepositorio = new AsignacionRepositorioMongo();
  const asignacion = await asignacionRepositorio.buscarPorId(asignacionId);
  if (!asignacion || asignacion.profesorId !== profesorId || !asignacion.activo) {
    return NextResponse.json({ error: "No tienes esta asignación activa" }, { status: 403 });
  }

  const seccionRepositorio = new SeccionRepositorioMongo();
  const periodoRepositorio = new PeriodoRepositorioMongo();
  const cursoRepositorio = new CursoRepositorioMongo();
  const estudianteRepositorio = new EstudianteRepositorioMongo();

  const [seccion, periodo, curso] = await Promise.all([
    seccionRepositorio.buscarPorId(asignacion.seccionId),
    periodoRepositorio.buscarPorId(asignacion.periodoId),
    cursoRepositorio.buscarPorId(asignacion.cursoId),
  ]);
  if (!seccion || !periodo || !curso) {
    return NextResponse.json({ error: "Sección, periodo o curso no encontrado" }, { status: 404 });
  }

  const resultado = await calcularNotasCurso(
    { asignacionId, anio: periodo.anio, ordenUnidad },
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
  const notasCurso = resultado.value;

  const estudiantes = await estudianteRepositorio.listar();
  const nombreEstudiante = (id: string) => estudiantes.find((e) => e.id === id)?.nombreCompleto ?? "(estudiante eliminado)";

  const filasOrdenadas = [...notasCurso.filas].sort((a, b) =>
    apellidoNombreReporte(nombreEstudiante(a.estudianteId)).localeCompare(apellidoNombreReporte(nombreEstudiante(b.estudianteId)), "es")
  );

  const tipos = Object.values(TIPOS_NOTA);
  const totalColumnas = 1 + tipos.length + 2; // Apellidos, cada tipo, Promedio, Letra
  const ultimaColumna = totalColumnas;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Dashboard Colegio";
  const hoja = workbook.addWorksheet("Notas", { views: [{ state: "frozen", ySplit: 5 }] });

  hoja.mergeCells(1, 1, 1, ultimaColumna);
  const celdaTitulo = hoja.getCell(1, 1);
  celdaTitulo.value = "NOTAS DEL CURSO";
  celdaTitulo.font = { name: FUENTE, bold: true, size: 14 };
  celdaTitulo.alignment = { horizontal: "center", vertical: "middle" };
  hoja.getRow(1).height = 22;

  hoja.mergeCells(2, 1, 2, ultimaColumna);
  hoja.getCell(2, 1).value = `Curso: ${curso.nombre}   |   Sección: ${seccion.grado} ${seccion.nombre}   |   Periodo: ${periodo.nombre}   |   Unidad ${ordenUnidad}`;
  hoja.getCell(2, 1).font = { name: FUENTE, italic: true };

  const filaEncabezado = 4;
  const encabezados = ["Apellidos y Nombres", ...tipos.map((t) => ETIQUETAS_TIPO[t]), "Promedio", "Letra"];
  encabezados.forEach((texto, i) => {
    const celda = hoja.getCell(filaEncabezado, i + 1);
    celda.value = texto;
    celda.font = { name: FUENTE, bold: true, color: { argb: "FFFFFFFF" } };
    celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL_ENCABEZADO } };
    celda.alignment = { horizontal: i === 0 ? "left" : "center", vertical: "middle" };
    celda.border = BORDE_CELDA;
  });

  filasOrdenadas.forEach((fila, indice) => {
    const numeroFila = filaEncabezado + 1 + indice;
    const esFranjaGris = indice % 2 === 1;

    function escribirCelda(columna: number, valor: string | number, opciones: { negrita?: boolean; color?: string } = {}) {
      const celda = hoja.getCell(numeroFila, columna);
      celda.value = valor;
      celda.border = BORDE_CELDA;
      celda.alignment = { horizontal: columna === 1 ? "left" : "center", vertical: "middle" };
      celda.font = { name: FUENTE, bold: opciones.negrita ?? false, color: opciones.color ? { argb: opciones.color } : undefined };
      if (esFranjaGris) {
        celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GRIS_FRANJA } };
      }
    }

    escribirCelda(1, apellidoNombreReporte(nombreEstudiante(fila.estudianteId)));
    tipos.forEach((tipo, i) => {
      const valor = fila.porTipo[tipo];
      escribirCelda(2 + i, valor === null ? "—" : valor);
    });
    const colorPromedio = fila.promedio === null ? undefined : fila.promedio < 11 ? ROJO_DESAPROBADO : VERDE_APROBADO;
    escribirCelda(2 + tipos.length, fila.promedio ?? "—", { negrita: true, color: colorPromedio });
    escribirCelda(3 + tipos.length, fila.letra ?? "—", { negrita: true, color: colorPromedio });
  });

  const filaNota = filaEncabezado + 1 + filasOrdenadas.length + 1;
  hoja.mergeCells(filaNota, 1, filaNota, ultimaColumna);
  const celdaNota = hoja.getCell(filaNota, 1);
  celdaNota.value =
    "Promedio = (Examen × 40% + Trabajo × 30% + Práctica × 20% + Participación × 10%). " +
    "Si al alumno le falta algún tipo, los pesos de los tipos presentes se re-normalizan entre sí. " +
    "El resultado se redondea al entero más cercano (0.5 a favor del alumno).";
  celdaNota.font = { name: FUENTE, italic: true, size: 9 };
  celdaNota.alignment = { wrapText: true };
  hoja.getRow(filaNota).height = 28;

  hoja.getColumn(1).width = 32;
  for (let i = 0; i < tipos.length; i++) {
    hoja.getColumn(2 + i).width = 13;
  }
  hoja.getColumn(2 + tipos.length).width = 11;
  hoja.getColumn(3 + tipos.length).width = 9;

  const buffer = await workbook.xlsx.writeBuffer();
  const nombreArchivo = `notas_${curso.nombre}_${seccion.grado}${seccion.nombre}_U${ordenUnidad}.xlsx`.replace(/\s+/g, "_");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
    },
  });
}
