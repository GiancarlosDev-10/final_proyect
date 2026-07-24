"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, SwitchCamera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

const INTERVALO_CAPTURA_MS = 500;
const CALIDAD_JPEG = 0.8;

type EstadoConexion = "inactivo" | "solicitando" | "activo" | "error";

function mensajeError(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") return "Permiso de cámara denegado. Habilítalo en la configuración del navegador.";
    if (error.name === "NotFoundError") return "No se encontró ninguna cámara en este dispositivo.";
    if (error.name === "NotReadableError") return "La cámara está siendo usada por otra aplicación.";
  }
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "Esta página necesita HTTPS (o localhost) para acceder a la cámara.";
  }
  return "No se pudo acceder a la cámara.";
}

const URL_RECONOCIMIENTO = process.env.NEXT_PUBLIC_RECONOCIMIENTO_URL;

interface ResultadoReconocimiento {
  reconocido: string | null;
  marcado?: boolean;
  estado?: string;
}

export function ConectorCamara() {
  const [estado, setEstado] = useState<EstadoConexion>("inactivo");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [framesEnviados, setFramesEnviados] = useState(0);
  const [ultimoResultado, setUltimoResultado] = useState<ResultadoReconocimiento | null>(null);
  const [camaraFrontal, setCamaraFrontal] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function detenerCaptura() {
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current);
      intervaloRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setEstado("inactivo");
  }

  async function iniciarStream(frontal: boolean) {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: frontal ? "user" : "environment" },
      audio: false,
    });
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }

  async function enviarFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < video.HAVE_CURRENT_DATA || !URL_RECONOCIMIENTO) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const contexto = canvas.getContext("2d");
    if (!contexto) return;
    contexto.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        try {
          const respuesta = await fetch(`${URL_RECONOCIMIENTO}/frame`, {
            method: "POST",
            headers: { "Content-Type": "image/jpeg" },
            body: blob,
          });
          if (respuesta.ok) {
            setFramesEnviados((n) => n + 1);
            setUltimoResultado(await respuesta.json());
          }
        } catch {
          // Fallo de un frame puntual no detiene la sesión de captura.
        }
      },
      "image/jpeg",
      CALIDAD_JPEG
    );
  }

  async function conectarCamara() {
    if (!URL_RECONOCIMIENTO) {
      setMensaje("Falta configurar NEXT_PUBLIC_RECONOCIMIENTO_URL.");
      setEstado("error");
      return;
    }
    setEstado("solicitando");
    setMensaje(null);
    setUltimoResultado(null);
    try {
      await iniciarStream(camaraFrontal);
      setEstado("activo");
      setFramesEnviados(0);
      intervaloRef.current = setInterval(enviarFrame, INTERVALO_CAPTURA_MS);
    } catch (error) {
      setMensaje(mensajeError(error));
      setEstado("error");
    }
  }

  async function cambiarCamara() {
    const nuevoFrontal = !camaraFrontal;
    setCamaraFrontal(nuevoFrontal);
    if (estado !== "activo") return;
    try {
      await iniciarStream(nuevoFrontal);
    } catch (error) {
      setMensaje(mensajeError(error));
      setEstado("error");
    }
  }

  useEffect(() => {
    return () => {
      detenerCaptura();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={cn("h-full w-full object-cover", camaraFrontal && "-scale-x-100")}
      />
      <canvas ref={canvasRef} className="hidden" />

      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 bg-gradient-to-b from-black/70 to-transparent p-4">
        <p className="text-sm font-medium text-white">Cámara de asistencia</p>
        {estado === "activo" && <StatusBadge variant="success">Conectada</StatusBadge>}
        {estado === "solicitando" && <StatusBadge variant="neutral">Solicitando permiso</StatusBadge>}
        {estado === "error" && <StatusBadge variant="error">Error</StatusBadge>}
        {estado === "inactivo" && <StatusBadge variant="neutral">Desconectada</StatusBadge>}
      </div>

      {estado !== "activo" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60 p-6 text-center">
          <p className="max-w-xs text-sm text-white/80">
            Activa la cámara para iniciar la captura de asistencia.
          </p>
          {mensaje && <p className="max-w-xs text-sm text-red-300">{mensaje}</p>}
          <Button onClick={conectarCamara} disabled={estado === "solicitando"}>
            <Camera /> Conectar cámara
          </Button>
        </div>
      )}

      {estado === "activo" && (
        <div className="absolute inset-x-0 bottom-0 space-y-3 bg-gradient-to-t from-black/80 to-transparent p-4">
          <p className="text-center text-sm text-white">
            {ultimoResultado?.reconocido
              ? ultimoResultado.marcado
                ? `Reconocido: ${ultimoResultado.reconocido} → ${ultimoResultado.estado}`
                : `Reconocido: ${ultimoResultado.reconocido} (confirmando...)`
              : "Nadie reconocido todavía."}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="secondary" onClick={cambiarCamara}>
              <SwitchCamera /> Cambiar cámara
            </Button>
            <Button variant="destructive" onClick={detenerCaptura}>
              <CameraOff /> Desconectar
            </Button>
          </div>
          <p className="text-center text-xs text-white/70">{framesEnviados} frames enviados</p>
        </div>
      )}
    </div>
  );
}
