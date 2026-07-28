"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ScanFace, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge, StatusBadgeVariant } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EstadoAsistencia, ESTADOS_ASISTENCIA } from "@/config/constantes";
import { horaActualHHMM, horaActualHHMMSS } from "@/modulos/asistencia/dominio/tiempo";
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
  const texto = ahora ? horaActualHHMMSS(ahora) : "--:--:--";
  return (
    <div className="rounded-lg bg-neutral-900 py-7 text-center ring-1 ring-foreground/10">
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

const TAMANO_PAGINA = 6;

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
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [ahora, setAhora] = useState<Date | null>(null);

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(intervalo);
  }, []);

  // Limpieza puramente cosmética: si se entró con ?bloqueId=... desde "Mi
  // Horario", una vez montado el componente ya no hace falta en la URL.
  // Se usa la History API directamente (no el router de Next) para no
  // disparar una vuelta al servidor que podría re-listar los bloques y
  // perder la clase fuera de su día real que se seleccionó al entrar.
  useEffect(() => {
    if (window.location.search) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  // Refresca el roster solo (sin recargar la página) mientras la sesión esté
  // abierta, para que las marcas que haga la cámara aparezcan solas.
  useEffect(() => {
    const sesionId = sesion?.id;
    const seccionId = bloqueSeleccionado?.seccionId;
    if (!sesionId || !seccionId) return;
    const intervalo = setInterval(async () => {
      const filas = await accionListarRoster(sesionId, seccionId);
      setRoster(filas);
    }, 2000);
    return () => clearInterval(intervalo);
  }, [sesion?.id, bloqueSeleccionado?.seccionId]);

  async function seleccionarBloque(bloque: BloqueDeHoy) {
    setCargando(true);
    setBloqueSeleccionado(bloque);
    setBusqueda("");
    setPagina(1);
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

  const totalPaginas = Math.max(1, Math.ceil(rosterFiltrado.length / TAMANO_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const rosterPagina = useMemo(
    () => rosterFiltrado.slice((paginaActual - 1) * TAMANO_PAGINA, paginaActual * TAMANO_PAGINA),
    [rosterFiltrado, paginaActual]
  );

  function onCambiarBusqueda(valor: string) {
    setBusqueda(valor);
    setPagina(1);
  }

  function etiquetaBloque(id: string) {
    const b = bloques.find((bl) => bl.bloqueHorarioId === id);
    return b ? `${b.cursoNombre} · ${b.seccionNombre} · ${b.horaInicio}–${b.horaFin}` : "";
  }

  return (
    <div className="space-y-6">
      {bloques.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tienes clases de Primaria o Secundaria hoy.</p>
      ) : (
        <div className="max-w-sm space-y-2">
          <Label>Clase</Label>
          <Select
            value={bloqueSeleccionado?.bloqueHorarioId ?? ""}
            onValueChange={(v) => {
              const bloque = bloques.find((bl) => bl.bloqueHorarioId === v);
              if (bloque) seleccionarBloque(bloque);
            }}
            itemToStringLabel={etiquetaBloque}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona una clase" />
            </SelectTrigger>
            <SelectContent>
              {bloques.map((bloque) => (
                <SelectItem key={bloque.bloqueHorarioId} value={bloque.bloqueHorarioId}>
                  {bloque.cursoNombre} · {bloque.seccionNombre} · {bloque.horaInicio}–{bloque.horaFin}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                  onChange={(e) => onCambiarBusqueda(e.target.value)}
                  placeholder="Buscar alumno por nombre o apellido..."
                  className="pl-8"
                />
              </div>

              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-64">Alumno</TableHead>
                    <TableHead className="w-28 text-center">Estado</TableHead>
                    <TableHead className="text-center">Marcar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rosterPagina.map((fila) => (
                    <TableRow key={fila.estudianteId}>
                      <TableCell className="truncate font-medium">{formatoApellidoPrimero(fila.nombreCompleto)}</TableCell>
                      <TableCell className="text-center">
                        <StatusBadge variant={ESTADO_INFO[fila.estado].variant}>{ESTADO_INFO[fila.estado].label}</StatusBadge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-center gap-1">
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

              {rosterFiltrado.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(paginaActual - 1) * TAMANO_PAGINA + 1}–
                    {Math.min(paginaActual * TAMANO_PAGINA, rosterFiltrado.length)} de {rosterFiltrado.length} alumnos
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagina((p) => p - 1)}
                      disabled={paginaActual <= 1}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <span className="text-sm font-medium">
                      Página {paginaActual} de {totalPaginas}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagina((p) => p + 1)}
                      disabled={paginaActual >= totalPaginas}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
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
                      <Button className="mt-4 h-11 w-full" onClick={guardarUmbrales} disabled={guardandoUmbrales}>
                        {guardandoUmbrales ? "Guardando..." : "Guardar horario"}
                      </Button>
                    </div>
                  </>
                )}

                <Link href="/asistencia/camara" className={buttonVariants({ variant: "outline", className: "w-full" })}>
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
