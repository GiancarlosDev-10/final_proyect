"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ScanFace, Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge, StatusBadgeVariant } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EstadoAsistencia, ESTADOS_ASISTENCIA } from "@/config/constantes";
import { BloqueDeHoy } from "@/modulos/asistencia/aplicacion/listar-bloques-de-hoy";
import { FilaRoster } from "@/modulos/asistencia/aplicacion/listar-roster";
import { SesionAsistenciaProps } from "@/modulos/asistencia/dominio/sesion-asistencia";
import {
  accionAbrirSesion,
  accionActualizarUmbrales,
  accionListarRoster,
  accionMarcarAsistencia,
} from "@/app/profesores/dashboard/asistencia/acciones";

const ESTADO_INFO: Record<EstadoAsistencia | "PENDIENTE", { label: string; variant: StatusBadgeVariant }> = {
  PRESENTE: { label: "Presente", variant: "success" },
  TARDANZA: { label: "Tardanza", variant: "warning" },
  AUSENTE: { label: "Ausente", variant: "error" },
  JUSTIFICADO: { label: "Justificado", variant: "neutral" },
  PENDIENTE: { label: "Pendiente", variant: "neutral" },
};

function horaActualHHMM(fecha: Date): string {
  return `${String(fecha.getHours()).padStart(2, "0")}:${String(fecha.getMinutes()).padStart(2, "0")}`;
}

function estadoVentana(horaActual: string, sesion: SesionAsistenciaProps): string {
  if (horaActual < sesion.horaEntrada) return "Aún no empieza la ventana de Presente";
  if (horaActual < sesion.horaLimiteTardanza) return "Ventana de Presente abierta";
  if (horaActual < sesion.horaCierre) return "Ventana de Tardanza abierta";
  return "Sesión cerrada";
}

/** Perú: "Nombre Apellido1 Apellido2" → se muestra "Apellido1 Apellido2, Nombre". */
function formatoApellidoPrimero(nombreCompleto: string): string {
  const [nombre, ...apellidos] = nombreCompleto.trim().split(/\s+/);
  return apellidos.length > 0 ? `${apellidos.join(" ")}, ${nombre}` : nombreCompleto;
}

function minutosDeHora(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function horaDesdeMinutos(totalMinutos: number): string {
  const normalizado = ((totalMinutos % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalizado / 60)).padStart(2, "0")}:${String(normalizado % 60).padStart(2, "0")}`;
}

function RelojDigital({ ahora }: { ahora: Date | null }) {
  const texto = ahora
    ? `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}:${String(ahora.getSeconds()).padStart(2, "0")}`
    : "--:--:--";
  return (
    <div className="rounded-lg bg-neutral-900 py-5 text-center ring-1 ring-foreground/10">
      <p className="font-mono text-4xl font-bold tabular-nums text-red-500">{texto}</p>
    </div>
  );
}

interface UmbralesForm {
  horaEntrada: string;
  horaLimiteTardanza: string;
  horaCierre: string;
}

interface Props {
  bloques: BloqueDeHoy[];
  sesionInicial: SesionAsistenciaProps | null;
  rosterInicial: FilaRoster[];
}

export function AsistenciaHoy({ bloques, sesionInicial, rosterInicial }: Props) {
  const [bloqueSeleccionado, setBloqueSeleccionado] = useState<BloqueDeHoy | null>(bloques[0] ?? null);
  const [sesion, setSesion] = useState<SesionAsistenciaProps | null>(sesionInicial);
  const [umbralesForm, setUmbralesForm] = useState<UmbralesForm | null>(
    sesionInicial && {
      horaEntrada: sesionInicial.horaEntrada,
      horaLimiteTardanza: sesionInicial.horaLimiteTardanza,
      horaCierre: sesionInicial.horaCierre,
    }
  );
  const [guardandoUmbrales, setGuardandoUmbrales] = useState(false);
  const [roster, setRoster] = useState<FilaRoster[]>(rosterInicial);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [ahora, setAhora] = useState<Date | null>(null);

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(intervalo);
  }, []);

  async function seleccionarBloque(bloque: BloqueDeHoy) {
    setCargando(true);
    setBloqueSeleccionado(bloque);
    setBusqueda("");
    const resultado = await accionAbrirSesion(bloque.bloqueHorarioId);
    if (!resultado.ok) {
      toast.error(resultado.mensaje);
      setCargando(false);
      return;
    }
    setSesion(resultado.sesion);
    setUmbralesForm({
      horaEntrada: resultado.sesion.horaEntrada,
      horaLimiteTardanza: resultado.sesion.horaLimiteTardanza,
      horaCierre: resultado.sesion.horaCierre,
    });
    const filas = await accionListarRoster(resultado.sesion.id, bloque.seccionId);
    setRoster(filas);
    setCargando(false);
  }

  function cambiarHoraEntrada(nuevaEntrada: string) {
    setUmbralesForm((prev) => {
      if (!prev) return prev;
      const delta = minutosDeHora(nuevaEntrada) - minutosDeHora(prev.horaEntrada);
      return {
        horaEntrada: nuevaEntrada,
        horaLimiteTardanza: horaDesdeMinutos(minutosDeHora(prev.horaLimiteTardanza) + delta),
        horaCierre: horaDesdeMinutos(minutosDeHora(prev.horaCierre) + delta),
      };
    });
  }

  async function guardarUmbrales() {
    if (!sesion || !umbralesForm) return;
    setGuardandoUmbrales(true);
    const resultado = await accionActualizarUmbrales({ sesionId: sesion.id, ...umbralesForm });
    setGuardandoUmbrales(false);
    if (!resultado.ok) {
      toast.error(resultado.mensaje);
      return;
    }
    setSesion(resultado.sesion);
    toast.success("Horario de la sesión actualizado");
  }

  async function marcar(estudianteId: string, estado: EstadoAsistencia) {
    if (!sesion || !bloqueSeleccionado) return;
    const resultado = await accionMarcarAsistencia(sesion.id, estudianteId, estado);
    if (!resultado.ok) {
      toast.error(resultado.mensaje);
      return;
    }
    const filas = await accionListarRoster(sesion.id, bloqueSeleccionado.seccionId);
    setRoster(filas);
  }

  const rosterFiltrado = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return roster;
    return roster.filter((f) => f.nombreCompleto.toLowerCase().includes(termino));
  }, [roster, busqueda]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {bloques.length === 0 ? "No tienes clases de Primaria o Secundaria hoy." : "Elige la clase que vas a dictar ahora."}
      </p>

      {bloques.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {bloques.map((bloque) => (
            <Card
              key={bloque.bloqueHorarioId}
              className={`w-56 cursor-pointer p-3 transition-colors hover:bg-muted/50 ${bloqueSeleccionado?.bloqueHorarioId === bloque.bloqueHorarioId ? "ring-2 ring-primary" : ""}`}
              onClick={() => seleccionarBloque(bloque)}
            >
              <p className="font-medium">{bloque.cursoNombre}</p>
              <p className="text-sm text-muted-foreground">{bloque.seccionNombre}</p>
              <p className="text-sm text-muted-foreground">{bloque.horaInicio} – {bloque.horaFin}</p>
            </Card>
          ))}
        </div>
      )}

      {sesion && bloqueSeleccionado && (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>{bloqueSeleccionado.cursoNombre} · {bloqueSeleccionado.seccionNombre}</CardTitle>
              <CardDescription>{roster.length} alumnos matriculados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative max-w-sm">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar alumno por nombre o apellido..."
                  className="pl-8"
                />
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alumno</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Marcar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rosterFiltrado.map((fila) => (
                    <TableRow key={fila.estudianteId}>
                      <TableCell className="font-medium">{formatoApellidoPrimero(fila.nombreCompleto)}</TableCell>
                      <TableCell>
                        <StatusBadge variant={ESTADO_INFO[fila.estado].variant}>{ESTADO_INFO[fila.estado].label}</StatusBadge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button size="xs" variant="outline" onClick={() => marcar(fila.estudianteId, ESTADOS_ASISTENCIA.PRESENTE)}>Presente</Button>
                          <Button size="xs" variant="outline" onClick={() => marcar(fila.estudianteId, ESTADOS_ASISTENCIA.TARDANZA)}>Tardanza</Button>
                          <Button size="xs" variant="outline" onClick={() => marcar(fila.estudianteId, ESTADOS_ASISTENCIA.AUSENTE)}>Ausente</Button>
                          <Button
                            size="xs"
                            variant="outline"
                            disabled={fila.estado !== "AUSENTE"}
                            onClick={() => marcar(fila.estudianteId, ESTADOS_ASISTENCIA.JUSTIFICADO)}
                          >
                            Justificar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {rosterFiltrado.length === 0 && !cargando && (
                    <TableRow>
                      <TableCell colSpan={3} className="h-20 text-center text-muted-foreground">
                        {roster.length === 0 ? "No hay alumnos matriculados en esta sección." : "Ningún alumno coincide con la búsqueda."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="w-full space-y-4 lg:w-80 lg:shrink-0">
            <Card>
              <CardContent className="space-y-3 pt-4">
                <RelojDigital ahora={ahora} />

                {ahora && (
                  <>
                    <StatusBadge variant="neutral" className="w-full justify-center">
                      {estadoVentana(horaActualHHMM(ahora), sesion)}
                    </StatusBadge>

                    <div className="space-y-2">
                      <div className="space-y-1">
                        <Label className="text-xs" title="Al cambiarla, el límite de tardanza y el cierre se mueven con ella.">
                          Hora de entrada
                        </Label>
                        <Input
                          type="time"
                          value={umbralesForm?.horaEntrada ?? ""}
                          onChange={(e) => cambiarHoraEntrada(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Límite de tardanza</Label>
                        <Input
                          type="time"
                          value={umbralesForm?.horaLimiteTardanza ?? ""}
                          onChange={(e) => setUmbralesForm((prev) => prev && { ...prev, horaLimiteTardanza: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Cierre de sesión</Label>
                        <Input
                          type="time"
                          value={umbralesForm?.horaCierre ?? ""}
                          onChange={(e) => setUmbralesForm((prev) => prev && { ...prev, horaCierre: e.target.value })}
                        />
                      </div>
                      <Button className="w-full" size="sm" onClick={guardarUmbrales} disabled={guardandoUmbrales}>
                        {guardandoUmbrales ? "Guardando..." : "Guardar horario"}
                      </Button>
                    </div>
                  </>
                )}

                <Link href="/profesores/dashboard/asistencia/camara" className={buttonVariants({ variant: "outline", className: "w-full" })}>
                  <ScanFace className="size-4" />
                  Conectar cámara
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
