import { NextRequest, NextResponse } from "next/server";
import { requerirRol } from "@/compartido/lib/autorizacion";
import { ROLES } from "@/config/constantes";

/**
 * Punto único a reemplazar cuando se conecte el script de Python real:
 * por ahora solo confirma la recepción del frame.
 */
async function procesarFrameAsistencia(frame: ArrayBuffer, profesorId: string) {
  return { ok: true as const, bytesRecibidos: frame.byteLength, profesorId };
}

export async function POST(request: NextRequest) {
  const profesorId = await requerirRol(ROLES.PROFESOR);
  if (!profesorId) {
    return NextResponse.json({ ok: false, mensaje: "No autorizado" }, { status: 401 });
  }

  const frame = await request.arrayBuffer();
  if (frame.byteLength === 0) {
    return NextResponse.json({ ok: false, mensaje: "Frame vacío" }, { status: 400 });
  }

  const resultado = await procesarFrameAsistencia(frame, profesorId);
  return NextResponse.json({ ok: true, bytesRecibidos: resultado.bytesRecibidos });
}
