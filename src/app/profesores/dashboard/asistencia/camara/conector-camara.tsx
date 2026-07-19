"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

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

export function ConectorCamara() {
  const [estado, setEstado] = useState<EstadoConexion>("inactivo");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [framesEnviados, setFramesEnviados] = useState(0);

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

  async function enviarFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < video.HAVE_CURRENT_DATA) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const contexto = canvas.getContext("2d");
    if (!contexto) return;
    contexto.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        try {
          const respuesta = await fetch("/api/asistencia/captura", {
            method: "POST",
            headers: { "Content-Type": "image/jpeg" },
            body: blob,
          });
          if (respuesta.ok) {
            setFramesEnviados((n) => n + 1);
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
    setEstado("solicitando");
    setMensaje(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setEstado("activo");
      setFramesEnviados(0);
      intervaloRef.current = setInterval(enviarFrame, INTERVALO_CAPTURA_MS);
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
    <Card className="max-w-xl">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>Cámara de asistencia</CardTitle>
            <CardDescription>Activa la cámara para iniciar la captura.</CardDescription>
          </div>
          {estado === "activo" && <StatusBadge variant="success">Conectada</StatusBadge>}
          {estado === "solicitando" && <StatusBadge variant="neutral">Solicitando permiso</StatusBadge>}
          {estado === "error" && <StatusBadge variant="error">Error</StatusBadge>}
          {estado === "inactivo" && <StatusBadge variant="neutral">Desconectada</StatusBadge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10">
          <video ref={videoRef} autoPlay muted playsInline className="aspect-video w-full object-cover" />
        </div>
        <canvas ref={canvasRef} className="hidden" />

        {mensaje && <p className="text-sm text-destructive">{mensaje}</p>}

        <div className="flex items-center justify-between gap-2">
          {estado === "activo" ? (
            <Button variant="destructive" onClick={detenerCaptura}>
              <CameraOff /> Desconectar
            </Button>
          ) : (
            <Button onClick={conectarCamara} disabled={estado === "solicitando"}>
              <Camera /> Conectar cámara
            </Button>
          )}
          {estado === "activo" && (
            <p className="text-sm text-muted-foreground">{framesEnviados} frames enviados</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
