import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { generarId } from "@/compartido/lib/uuid";
import { ROLES, ORDEN_DIAS_SEMANA, PERIODOS_HORARIO, DiaSemana } from "@/config/constantes";

import { UsuarioModel } from "@/modulos/usuarios/infraestructura/usuario-schema";
import { AreaModel } from "@/modulos/areas/infraestructura/area-schema";
import { CursoModel } from "@/modulos/cursos/infraestructura/curso-schema";
import { SeccionModel } from "@/modulos/secciones/infraestructura/seccion-schema";
import { MatriculaModel } from "@/modulos/matriculas/infraestructura/matricula-schema";
import { EstudianteModel } from "@/modulos/estudiantes/infraestructura/estudiante-schema";
import { AsignacionModel } from "@/modulos/asignaciones/infraestructura/asignacion-schema";
import { PeriodoModel } from "@/modulos/periodos/infraestructura/periodo-schema";
import { BloqueHorarioModel } from "@/modulos/horarios/infraestructura/bloque-horario-schema";
import { NotaModel } from "@/modulos/notas/infraestructura/nota-schema";
import { UnidadDidacticaModel } from "@/modulos/unidades-didacticas/infraestructura/unidad-didactica-schema";
import { TelegramChatModel } from "@/modulos/telegram/infraestructura/telegram-chat-schema";
import { TelegramIntentoModel } from "@/modulos/telegram/infraestructura/telegram-intento-schema";

const ANIO = 2026;
const ALUMNOS_POR_SECCION = 20;
const PASSWORD_PROFESORES = "Profesor#2026!";
const PROFESOR_EXISTENTE_ID = "USR-0002"; // profesor@colegio.edu.pe — se conserva, no se recrea

// ---------- utilidades ----------

function ahora() {
  return new Date().toISOString();
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim()
    .replace(/\s+/g, ".");
}

const NOMBRES_M = [
  "Juan", "Carlos", "Luis", "José", "Miguel", "Jorge", "Diego", "Pedro", "Manuel", "Ricardo",
  "Fernando", "Alberto", "Eduardo", "Raúl", "Víctor", "Andrés", "Gabriel", "Sebastián", "Mateo",
  "Nicolás", "Adrián", "Bruno", "Rodrigo", "Ignacio", "Sergio", "Renzo", "Piero", "Franco",
  "Alexander", "Cristian", "Alonso", "Joaquín", "Emilio", "Marcelo", "Gonzalo", "Fabricio", "Leonardo",
];
const NOMBRES_F = [
  "María", "Rosa", "Carmen", "Ana", "Luz", "Patricia", "Sandra", "Karla", "Diana", "Fiorella",
  "Milagros", "Katherine", "Vanessa", "Gabriela", "Andrea", "Camila", "Valentina", "Sofía",
  "Isabella", "Daniela", "Alejandra", "Cristina", "Pilar", "Elena", "Mónica", "Verónica", "Lucía",
  "Ximena", "Antonella", "Brigitte", "Yolanda", "Gladys", "Maritza", "Estefanía", "Alessandra", "Ariana",
];
const APELLIDOS = [
  "García", "Rodríguez", "Gonzáles", "Fernández", "López", "Martínez", "Sánchez", "Pérez", "Flores",
  "Ramírez", "Torres", "Díaz", "Vásquez", "Castillo", "Rojas", "Chávez", "Gutiérrez", "Ortiz", "Silva",
  "Mendoza", "Reyes", "Morales", "Herrera", "Medina", "Aguilar", "Vargas", "Castro", "Romero", "Suárez",
  "Rivera", "Quispe", "Mamani", "Huamán", "Condori", "Paredes", "Salazar", "Cárdenas", "Guerrero",
  "Espinoza", "Palacios", "Ramos", "Cruz", "Vega", "Campos", "Ríos", "Ponce", "Cabrera", "Zúñiga", "Ochoa",
];

function generarNombreCompleto(genero: "M" | "F"): string {
  const nombre = genero === "M" ? pick(NOMBRES_M) : pick(NOMBRES_F);
  return `${nombre} ${pick(APELLIDOS)} ${pick(APELLIDOS)}`;
}

const documentosUsados = new Set<string>();
function generarDocumento(): string {
  let doc: string;
  do {
    doc = String(randomInt(10_000_000, 99_999_999));
  } while (documentosUsados.has(doc));
  documentosUsados.add(doc);
  return doc;
}

function generarTelefono(): string {
  return `9${randomInt(10_000_000, 99_999_999)}`;
}

const emailsUsados = new Set<string>();
function generarEmailProfesor(nombreCompleto: string): string {
  const base = slugify(nombreCompleto);
  let email = `${base}@colegio.edu.pe`;
  let i = 2;
  while (emailsUsados.has(email)) {
    email = `${base}${i}@colegio.edu.pe`;
    i++;
  }
  emailsUsados.add(email);
  return email;
}

function fechaNacimiento(edadAprox: number): string {
  const anioNacimiento = ANIO - edadAprox;
  const mes = String(randomInt(1, 12)).padStart(2, "0");
  const dia = String(randomInt(1, 28)).padStart(2, "0");
  return `${anioNacimiento}-${mes}-${dia}`;
}

// ---------- horario: asignación de slots sin choques ----------

const ocupadoProfesor = new Set<string>();
const ocupadoSeccion = new Set<string>();

function asignarSlot(profesorId: string, seccionId: string): { diaSemana: DiaSemana; horaInicio: string; horaFin: string } {
  for (const dia of ORDEN_DIAS_SEMANA) {
    for (const periodo of PERIODOS_HORARIO) {
      const keyProf = `${profesorId}|${dia}|${periodo.horaInicio}`;
      const keySec = `${seccionId}|${dia}|${periodo.horaInicio}`;
      if (!ocupadoProfesor.has(keyProf) && !ocupadoSeccion.has(keySec)) {
        ocupadoProfesor.add(keyProf);
        ocupadoSeccion.add(keySec);
        return { diaSemana: dia, horaInicio: periodo.horaInicio, horaFin: periodo.horaFin };
      }
    }
  }
  throw new Error(`No hay slot libre para profesor ${profesorId} / sección ${seccionId}`);
}

// ---------- definición curricular ----------

const NOMBRES_AREAS = [
  "Matemática", "Comunicación", "Ciencia y Tecnología", "Personal Social", "Arte y Cultura",
  "Educación Física", "Educación Religiosa", "Inglés", "Ciencias Sociales",
  "Desarrollo Personal, Ciudadanía y Cívica", "Educación para el Trabajo", "Psicomotriz",
  "Descubrimos el Mundo Natural y Cultural",
];

const CURSOS_PRIMARIA = [
  { nombre: "Matemática", area: "Matemática" },
  { nombre: "Comunicación", area: "Comunicación" },
  { nombre: "Ciencia y Tecnología", area: "Ciencia y Tecnología" },
  { nombre: "Personal Social", area: "Personal Social" },
  { nombre: "Arte y Cultura", area: "Arte y Cultura" },
  { nombre: "Educación Física", area: "Educación Física" },
  { nombre: "Educación Religiosa", area: "Educación Religiosa" },
  { nombre: "Inglés", area: "Inglés" },
];

const CURSOS_SECUNDARIA = [
  { nombre: "Álgebra", area: "Matemática" },
  { nombre: "Aritmética", area: "Matemática" },
  { nombre: "Geometría", area: "Matemática" },
  { nombre: "Trigonometría", area: "Matemática" },
  { nombre: "Comunicación", area: "Comunicación" },
  { nombre: "Física", area: "Ciencia y Tecnología" },
  { nombre: "Química", area: "Ciencia y Tecnología" },
  { nombre: "Biología", area: "Ciencia y Tecnología" },
  { nombre: "Ciencias Sociales", area: "Ciencias Sociales" },
  { nombre: "Desarrollo Personal, Ciudadanía y Cívica", area: "Desarrollo Personal, Ciudadanía y Cívica" },
  { nombre: "Arte y Cultura", area: "Arte y Cultura" },
  { nombre: "Educación Física", area: "Educación Física" },
  { nombre: "Educación Religiosa", area: "Educación Religiosa" },
  { nombre: "Inglés", area: "Inglés" },
  { nombre: "Educación para el Trabajo", area: "Educación para el Trabajo" },
];

const CURSOS_INICIAL_NUEVOS = [
  { nombre: "Psicomotriz", area: "Psicomotriz" },
  { nombre: "Descubrimos el Mundo Natural y Cultural", area: "Descubrimos el Mundo Natural y Cultural" },
];

const GRADOS_INICIAL = ["3 años", "4 años", "5 años"];
const GRADOS_PRIMARIA = ["1°", "2°", "3°", "4°", "5°", "6°"];
const GRADOS_SECUNDARIA = ["1°", "2°", "3°", "4°", "5°"];
const NOMBRES_SECCION = ["A", "B"];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log("Conectado a MongoDB.");

  // ---------- 1. limpieza ----------
  await Promise.all([
    AreaModel.deleteMany({}),
    CursoModel.deleteMany({}),
    SeccionModel.deleteMany({}),
    MatriculaModel.deleteMany({}),
    EstudianteModel.deleteMany({}),
    AsignacionModel.deleteMany({}),
    BloqueHorarioModel.deleteMany({}),
    PeriodoModel.deleteMany({}),
    NotaModel.deleteMany({}),
    UnidadDidacticaModel.deleteMany({}),
    TelegramChatModel.deleteMany({}),
    TelegramIntentoModel.deleteMany({}),
    UsuarioModel.deleteMany({ rol: ROLES.PROFESOR, _id: { $ne: PROFESOR_EXISTENTE_ID } }),
  ]);
  console.log("Datos anteriores eliminados.");

  // ---------- 2. periodo ----------
  const periodoId = generarId("PER");
  await PeriodoModel.create({
    _id: periodoId,
    nombre: "Año Escolar 2026",
    anio: ANIO,
    estado: "ABIERTO",
    fechaInicio: "2026-03-01",
    fechaFin: "2026-12-18",
    creadoEn: ahora(),
    actualizadoEn: ahora(),
  });

  // ---------- 3. áreas ----------
  const areaIdPorNombre = new Map<string, string>();
  const areasDocs = NOMBRES_AREAS.map((nombre) => {
    const id = generarId("ARE");
    areaIdPorNombre.set(nombre, id);
    return { _id: id, nombre, activo: true, creadoEn: ahora(), actualizadoEn: ahora() };
  });
  await AreaModel.insertMany(areasDocs);

  // ---------- 4. cursos ----------
  // Un mismo curso (ej. "Comunicación") puede dictarse en más de un nivel; en
  // vez de crear un documento por nivel (lo que duplicaba 6 materias), se
  // reusa el mismo cursoId por nombre y se acumulan los niveles que lo dictan
  // para armar la descripción ("Primaria y Secundaria", etc.).
  type Nivel = "INICIAL" | "PRIMARIA" | "SECUNDARIA";
  const ETIQUETA_NIVEL: Record<Nivel, string> = { INICIAL: "Inicial", PRIMARIA: "Primaria", SECUNDARIA: "Secundaria" };
  const ORDEN_NIVELES: Nivel[] = ["INICIAL", "PRIMARIA", "SECUNDARIA"];

  function etiquetaNiveles(niveles: Set<Nivel>): string {
    const presentes = ORDEN_NIVELES.filter((n) => niveles.has(n)).map((n) => ETIQUETA_NIVEL[n]);
    if (presentes.length <= 1) return presentes[0] ?? "";
    return `${presentes.slice(0, -1).join(", ")} y ${presentes[presentes.length - 1]}`;
  }

  // Estos 3 cursos de Primaria son los mismos que dicta la profesora de aula
  // de Inicial (ver "cursosInicial" más abajo), por eso también llevan INICIAL.
  const NOMBRES_CURSOS_INICIAL_DESDE_PRIMARIA = new Set(["Matemática", "Comunicación", "Personal Social"]);

  const cursoIdPrimariaPorArea = new Map<string, string>(); // nombre área -> cursoId (primaria)
  const cursoIdSecundariaPorNombre = new Map<string, string>(); // nombre curso -> cursoId (secundaria)
  const cursoIdInicialPorNombre = new Map<string, string>(); // nombre curso nuevo de inicial -> cursoId
  const nivelesPorCursoId = new Map<string, Set<Nivel>>();

  const cursosDocs: Array<{
    _id: string; nombre: string; descripcion: string; areaId: string; activo: boolean; creadoEn: string; actualizadoEn: string;
  }> = [];

  for (const c of CURSOS_PRIMARIA) {
    const id = generarId("CUR");
    cursoIdPrimariaPorArea.set(c.area, id);
    const niveles = new Set<Nivel>(["PRIMARIA"]);
    if (NOMBRES_CURSOS_INICIAL_DESDE_PRIMARIA.has(c.nombre)) niveles.add("INICIAL");
    nivelesPorCursoId.set(id, niveles);
    cursosDocs.push({ _id: id, nombre: c.nombre, descripcion: "", areaId: areaIdPorNombre.get(c.area)!, activo: true, creadoEn: ahora(), actualizadoEn: ahora() });
  }
  for (const c of CURSOS_SECUNDARIA) {
    const idPrimariaMismoNombre = CURSOS_PRIMARIA.some((p) => p.nombre === c.nombre)
      ? cursoIdPrimariaPorArea.get(c.area)
      : undefined;

    if (idPrimariaMismoNombre) {
      // Misma materia que ya se dicta en Primaria: no crear otro documento.
      cursoIdSecundariaPorNombre.set(c.nombre, idPrimariaMismoNombre);
      nivelesPorCursoId.get(idPrimariaMismoNombre)!.add("SECUNDARIA");
      continue;
    }

    const id = generarId("CUR");
    cursoIdSecundariaPorNombre.set(c.nombre, id);
    nivelesPorCursoId.set(id, new Set<Nivel>(["SECUNDARIA"]));
    cursosDocs.push({ _id: id, nombre: c.nombre, descripcion: "", areaId: areaIdPorNombre.get(c.area)!, activo: true, creadoEn: ahora(), actualizadoEn: ahora() });
  }
  for (const c of CURSOS_INICIAL_NUEVOS) {
    const id = generarId("CUR");
    cursoIdInicialPorNombre.set(c.nombre, id);
    nivelesPorCursoId.set(id, new Set<Nivel>(["INICIAL"]));
    cursosDocs.push({ _id: id, nombre: c.nombre, descripcion: "", areaId: areaIdPorNombre.get(c.area)!, activo: true, creadoEn: ahora(), actualizadoEn: ahora() });
  }

  for (const doc of cursosDocs) {
    doc.descripcion = etiquetaNiveles(nivelesPorCursoId.get(doc._id)!);
  }

  await CursoModel.insertMany(cursosDocs);
  console.log(`${areasDocs.length} áreas, ${cursosDocs.length} cursos creados.`);

  // ---------- 5. secciones ----------
  interface SeccionInfo { id: string; grado: string; nombreSeccion: string; }
  const seccionesInicial: SeccionInfo[] = [];
  const seccionesPrimaria: SeccionInfo[] = [];
  const seccionesSecundaria: SeccionInfo[] = [];
  const seccionesDocs: Array<{ _id: string; nombre: string; grado: string; nivel: string; anio: number; activo: boolean; creadoEn: string; actualizadoEn: string }> = [];

  function crearSecciones(grados: string[], nivel: "INICIAL" | "PRIMARIA" | "SECUNDARIA", destino: SeccionInfo[]) {
    for (const grado of grados) {
      for (const nombreSeccion of NOMBRES_SECCION) {
        const id = generarId("SEC");
        destino.push({ id, grado, nombreSeccion });
        seccionesDocs.push({ _id: id, nombre: nombreSeccion, grado, nivel, anio: ANIO, activo: true, creadoEn: ahora(), actualizadoEn: ahora() });
      }
    }
  }
  crearSecciones(GRADOS_INICIAL, "INICIAL", seccionesInicial);
  crearSecciones(GRADOS_PRIMARIA, "PRIMARIA", seccionesPrimaria);
  crearSecciones(GRADOS_SECUNDARIA, "SECUNDARIA", seccionesSecundaria);
  await SeccionModel.insertMany(seccionesDocs);
  console.log(`${seccionesDocs.length} secciones creadas (${seccionesInicial.length} inicial, ${seccionesPrimaria.length} primaria, ${seccionesSecundaria.length} secundaria).`);

  // ---------- 6. profesores + asignaciones + horario ----------
  const usuariosNuevosDocs: Array<{ _id: string; email: string; passwordHash: string; rol: string; nombreCompleto: string; activo: boolean; creadoEn: string; actualizadoEn: string }> = [];
  const asignacionesDocs: Array<{ _id: string; profesorId: string; cursoId: string; seccionId: string; periodoId: string; activo: boolean; creadoEn: string; actualizadoEn: string }> = [];
  const bloquesDocs: Array<{ _id: string; asignacionId: string; profesorId: string; diaSemana: DiaSemana; horaInicio: string; horaFin: string; creadoEn: string; actualizadoEn: string }> = [];

  const passwordHashProfesores = await bcrypt.hash(PASSWORD_PROFESORES, 10);

  async function crearProfesor(): Promise<string> {
    const genero = Math.random() < 0.5 ? "M" : "F";
    const nombreCompleto = generarNombreCompleto(genero);
    const id = generarId("USR");
    usuariosNuevosDocs.push({
      _id: id,
      email: generarEmailProfesor(nombreCompleto),
      passwordHash: passwordHashProfesores,
      rol: ROLES.PROFESOR,
      nombreCompleto,
      activo: true,
      creadoEn: ahora(),
      actualizadoEn: ahora(),
    });
    return id;
  }

  function crearAsignacionYBloque(profesorId: string, cursoId: string, seccionId: string) {
    const asignacionId = generarId("ASI");
    asignacionesDocs.push({
      _id: asignacionId, profesorId, cursoId, seccionId, periodoId,
      activo: true, creadoEn: ahora(), actualizadoEn: ahora(),
    });
    const slot = asignarSlot(profesorId, seccionId);
    bloquesDocs.push({
      _id: generarId("BLQ"), asignacionId, profesorId,
      diaSemana: slot.diaSemana, horaInicio: slot.horaInicio, horaFin: slot.horaFin,
      creadoEn: ahora(), actualizadoEn: ahora(),
    });
  }

  // Inicial: 1 profesora de aula por sección, dicta los 5 cursos solo a su sección.
  const cursosInicial = [
    cursoIdPrimariaPorArea.get("Matemática")!,
    cursoIdPrimariaPorArea.get("Comunicación")!,
    cursoIdPrimariaPorArea.get("Personal Social")!,
    cursoIdInicialPorNombre.get("Psicomotriz")!,
    cursoIdInicialPorNombre.get("Descubrimos el Mundo Natural y Cultural")!,
  ];
  for (const seccion of seccionesInicial) {
    const profesorId = await crearProfesor();
    for (const cursoId of cursosInicial) {
      crearAsignacionYBloque(profesorId, cursoId, seccion.id);
    }
  }

  // Primaria: 1 profesor especialista por área, dicta su curso a TODAS las secciones de primaria.
  for (const c of CURSOS_PRIMARIA) {
    const profesorId = await crearProfesor();
    const cursoId = cursoIdPrimariaPorArea.get(c.area)!;
    for (const seccion of seccionesPrimaria) {
      crearAsignacionYBloque(profesorId, cursoId, seccion.id);
    }
  }

  // Secundaria: 1 profesor especialista por área (Matemática y Ciencia y Tecnología divididas), dicta a TODAS las secciones de secundaria.
  const CURSOS_SECUNDARIA_NO_MATE = CURSOS_SECUNDARIA.filter(
    (c) => c.area !== "Matemática" && c.area !== "Ciencia y Tecnología"
  );
  for (const c of CURSOS_SECUNDARIA_NO_MATE) {
    const esComunicacion = c.nombre === "Comunicación";
    const profesorId = esComunicacion ? PROFESOR_EXISTENTE_ID : await crearProfesor();
    const cursoId = cursoIdSecundariaPorNombre.get(c.nombre)!;
    for (const seccion of seccionesSecundaria) {
      crearAsignacionYBloque(profesorId, cursoId, seccion.id);
    }
  }
  const gruposMatematica = [
    ["Álgebra", "Trigonometría"],
    ["Aritmética", "Geometría"],
  ];
  for (const grupo of gruposMatematica) {
    const profesorId = await crearProfesor();
    for (const nombreCurso of grupo) {
      const cursoId = cursoIdSecundariaPorNombre.get(nombreCurso)!;
      for (const seccion of seccionesSecundaria) {
        crearAsignacionYBloque(profesorId, cursoId, seccion.id);
      }
    }
  }

  // Ciencia y Tecnología en Secundaria: un mismo especialista dicta las 3
  // ramas, repartidas por grado (igual que se hizo al migrar los datos reales).
  const gruposCienciaTecnologia: Array<{ nombreCurso: string; grados: string[] }> = [
    { nombreCurso: "Biología", grados: ["1°", "2°"] },
    { nombreCurso: "Química", grados: ["3°"] },
    { nombreCurso: "Física", grados: ["4°", "5°"] },
  ];
  const profesorCienciaTecnologia = await crearProfesor();
  for (const grupo of gruposCienciaTecnologia) {
    const cursoId = cursoIdSecundariaPorNombre.get(grupo.nombreCurso)!;
    for (const seccion of seccionesSecundaria.filter((s) => grupo.grados.includes(s.grado))) {
      crearAsignacionYBloque(profesorCienciaTecnologia, cursoId, seccion.id);
    }
  }

  if (usuariosNuevosDocs.length > 0) await UsuarioModel.insertMany(usuariosNuevosDocs);
  await AsignacionModel.insertMany(asignacionesDocs);
  await BloqueHorarioModel.insertMany(bloquesDocs);
  console.log(`${usuariosNuevosDocs.length} profesores nuevos, ${asignacionesDocs.length} asignaciones, ${bloquesDocs.length} bloques de horario creados.`);

  // ---------- 7. estudiantes + matrículas ----------
  const PARENTESCOS = ["Madre", "Padre", "Tutor", "Abuela", "Abuelo"];
  const estudiantesDocs: Array<{ _id: string; documento: string; nombreCompleto: string; fechaNacimiento: string; apoderado: { nombre: string; telefono: string; parentesco: string }; activo: boolean; creadoEn: string; actualizadoEn: string }> = [];
  const matriculasDocs: Array<{ _id: string; estudianteId: string; seccionId: string; anio: number; activo: boolean; creadoEn: string; actualizadoEn: string }> = [];

  function edadParaGrado(nivel: "INICIAL" | "PRIMARIA" | "SECUNDARIA", grado: string): number {
    if (nivel === "INICIAL") return Number(grado.split(" ")[0]);
    const gradoNum = Number(grado.replace("°", ""));
    return nivel === "PRIMARIA" ? 5 + gradoNum : 11 + gradoNum;
  }

  function generarAlumnosDeSeccion(nivel: "INICIAL" | "PRIMARIA" | "SECUNDARIA", seccion: SeccionInfo) {
    const edad = edadParaGrado(nivel, seccion.grado);
    for (let i = 0; i < ALUMNOS_POR_SECCION; i++) {
      const genero = Math.random() < 0.5 ? "M" : "F";
      const nombreCompleto = generarNombreCompleto(genero);
      const estudianteId = generarId("EST");
      estudiantesDocs.push({
        _id: estudianteId,
        documento: generarDocumento(),
        nombreCompleto,
        fechaNacimiento: fechaNacimiento(edad),
        apoderado: {
          nombre: `${pick(NOMBRES_M.concat(NOMBRES_F))} ${nombreCompleto.split(" ").slice(1).join(" ")}`,
          telefono: generarTelefono(),
          parentesco: pick(PARENTESCOS),
        },
        activo: true,
        creadoEn: ahora(),
        actualizadoEn: ahora(),
      });
      matriculasDocs.push({
        _id: generarId("MAT"),
        estudianteId,
        seccionId: seccion.id,
        anio: ANIO,
        activo: true,
        creadoEn: ahora(),
        actualizadoEn: ahora(),
      });
    }
  }

  for (const s of seccionesInicial) generarAlumnosDeSeccion("INICIAL", s);
  for (const s of seccionesPrimaria) generarAlumnosDeSeccion("PRIMARIA", s);
  for (const s of seccionesSecundaria) generarAlumnosDeSeccion("SECUNDARIA", s);

  await EstudianteModel.insertMany(estudiantesDocs);
  await MatriculaModel.insertMany(matriculasDocs);
  console.log(`${estudiantesDocs.length} estudiantes y ${matriculasDocs.length} matrículas creadas.`);

  await mongoose.disconnect();
  console.log("Listo.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
