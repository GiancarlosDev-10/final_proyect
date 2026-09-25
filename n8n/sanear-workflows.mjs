// Genera versiones sin secretos de los workflows exportados de n8n, aptas para
// subir al repo. Lee n8n/originales/ (ignorado por git, tiene las claves
// reales) y escribe n8n/workflows/. Los valores sensibles pasan a leerse de
// variables de entorno de n8n ($env.X), definidas en deploy/contabo/.env.
//
// Uso: node n8n/sanear-workflows.mjs   (volver a correrlo tras cada export)

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = dirname(fileURLToPath(import.meta.url));
const dirOriginales = join(raiz, "originales");
const dirSalida = join(raiz, "workflows");

// archivo original -> [archivo limpio, nombre del workflow]. Los nombres de
// "Bot Padres" venían cruzados en n8n: el que decía "Notificación" hacía la
// vinculación por DNI/código y viceversa.
const WORKFLOWS = {
  "Bot Profesores - Consulta de Notas.json": ["bot-profesores-notas.json", "Bot Profesores - Consulta de Notas"],
  "Bot Manual - Ayuda Sistema Académico.json": ["bot-manual-ayuda.json", "Bot Manual - Ayuda Sistema Académico"],
  "Bot Padres - Notificación de Asistencia.json": ["bot-padres-vinculacion.json", "Bot Padres - Vinculación"],
  "Bot Padres - Vinculación de Asistencia.json": [
    "bot-padres-notificacion-asistencia.json",
    "Bot Padres - Notificación de Asistencia",
  ],
};

// const X = '...';  ->  const X = $env.Y;
const CONSTANTES_A_ENV = {
  BASE_URL: "DASHBOARD_URL",
  API_SECRET: "TELEGRAM_API_SECRET",
  WEBHOOK_SECRET: "N8N_WEBHOOK_SECRET",
  BOT_TOKEN: "TELEGRAM_BOT_MANUAL_TOKEN",
  OPENAI_API_KEY: "OPENAI_API_KEY",
};

function sanearCodigo(codigo) {
  let resultado = codigo;
  for (const [constante, variable] of Object.entries(CONSTANTES_A_ENV)) {
    resultado = resultado.replace(
      new RegExp(`const ${constante} = (['"\`]).*?\\1;`, "g"),
      `const ${constante} = $env.${variable};`
    );
  }
  return resultado;
}

// Credencial de Telegram correcta por workflow. "Bot Manual" es un bot
// distinto al de profesores pero se había exportado con la misma credencial;
// y en la vinculación de padres, el nodo de error de código usaba el bot de
// profesores en vez de "Bot Padres" (el apoderado nunca recibía ese aviso).
const CREDENCIAL_TELEGRAM = {
  "bot-profesores-notas.json": "Bot Profesores",
  "bot-manual-ayuda.json": "Bot Manual",
  "bot-padres-vinculacion.json": "Bot Padres",
  "bot-padres-notificacion-asistencia.json": "Bot Padres",
};

function sanearWorkflow(workflow, archivoSalida, nombre) {
  const { id, versionId, meta, pinData, active, ...resto } = workflow;

  const nodes = resto.nodes.map((nodo) => {
    const parameters = { ...nodo.parameters };
    for (const clave of ["jsCode", "code"]) {
      if (typeof parameters[clave] === "string") parameters[clave] = sanearCodigo(parameters[clave]);
    }

    const credentials = nodo.credentials
      ? Object.fromEntries(
          Object.entries(nodo.credentials).map(([tipo, cred]) => [
            tipo,
            {
              id: "REEMPLAZAR",
              name: tipo === "telegramApi" ? CREDENCIAL_TELEGRAM[archivoSalida] : cred.name,
            },
          ])
        )
      : undefined;

    return { ...nodo, parameters, ...(credentials && { credentials }) };
  });

  return { ...resto, name: nombre, nodes, pinData: {}, active: false };
}

// Última red de seguridad: si algo con pinta de secreto sobrevivió, no se escribe.
const PATRONES_SECRETO = [/\d{8,10}:AA[\w-]{30,}/, /sk-[\w-]{20,}/, /const \w*(SECRET|TOKEN|KEY)\w* = ['"`]/];

for (const archivo of readdirSync(dirOriginales).filter((f) => f.endsWith(".json"))) {
  const destino = WORKFLOWS[archivo];
  if (!destino) {
    console.warn(`⚠ Sin mapeo, se omite: ${archivo}`);
    continue;
  }
  const [archivoSalida, nombre] = destino;
  const original = JSON.parse(readFileSync(join(dirOriginales, archivo), "utf8"));
  const limpio = JSON.stringify(sanearWorkflow(original, archivoSalida, nombre), null, 2) + "\n";

  const fuga = PATRONES_SECRETO.find((patron) => patron.test(limpio));
  if (fuga) throw new Error(`Posible secreto en ${archivoSalida} (patrón ${fuga}); revisa el original.`);

  writeFileSync(join(dirSalida, archivoSalida), limpio);
  console.log(`✔ ${archivo} -> workflows/${archivoSalida}`);
}
