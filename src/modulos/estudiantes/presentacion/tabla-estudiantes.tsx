"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, MoreVertical, Search, Upload } from "lucide-react";
import { EstudianteProps } from "@/modulos/estudiantes/dominio/estudiante";
import { EstudianteResumen } from "@/modulos/estudiantes/aplicacion/listar-estudiantes-por-seccion";
import { SeccionProps } from "@/modulos/secciones/dominio/seccion";
import {
  accionCrearEstudianteEnSeccion,
  accionActualizarEstudiante,
  accionEliminarEstudiante,
  accionListarEstudiantesPorSeccion,
  accionObtenerEstudiante,
} from "@/modulos/estudiantes/presentacion/acciones";
import { NIVELES_EDUCATIVOS, ETIQUETAS_NIVEL_EDUCATIVO, ORDEN_NIVELES_EDUCATIVOS, NivelEducativo } from "@/config/constantes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  secciones: SeccionProps[];
}

const LADO_MAXIMO_FOTO = 480;
const CALIDAD_JPEG_FOTO = 0.85;

function numeroDeGrado(grado: string): number {
  const match = grado.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function compararSecciones(a: SeccionProps, b: SeccionProps): number {
  const nivelDiff = ORDEN_NIVELES_EDUCATIVOS.indexOf(a.nivel) - ORDEN_NIVELES_EDUCATIVOS.indexOf(b.nivel);
  if (nivelDiff !== 0) return nivelDiff;
  const gradoDiff = numeroDeGrado(a.grado) - numeroDeGrado(b.grado);
  if (gradoDiff !== 0) return gradoDiff;
  return a.nombre.localeCompare(b.nombre);
}

/** Redimensiona/comprime en el navegador antes de subir, para no acumular fotos pesadas en Mongo. */
function comprimirImagen(archivo: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(archivo);
    img.onload = () => {
      const escala = Math.min(1, LADO_MAXIMO_FOTO / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * escala);
      canvas.height = Math.round(img.height * escala);
      const contexto = canvas.getContext("2d");
      if (!contexto) {
        URL.revokeObjectURL(url);
        reject(new Error("No se pudo procesar la imagen"));
        return;
      }
      contexto.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) resolve(blob);
          else reject(new Error("No se pudo comprimir la imagen"));
        },
        "image/jpeg",
        CALIDAD_JPEG_FOTO
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Archivo de imagen inválido"));
    };
    img.src = url;
  });
}

function TarjetaEstudiante({
  estudiante,
  onEditar,
  onEliminar,
}: {
  estudiante: EstudianteResumen;
  onEditar: (estudiante: EstudianteResumen) => void;
  onEliminar: (id: string) => void;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{estudiante.nombreCompleto}</p>
          <p className="truncate text-sm text-muted-foreground">Documento: {estudiante.documento}</p>
          <p className="truncate text-sm text-muted-foreground">Apoderado: {estudiante.apoderado.nombre}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Acciones" />}>
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEditar(estudiante)}>
              <Pencil className="size-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => onEliminar(estudiante.id)}>
              <Trash2 className="size-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-3">
        {estudiante.activo ? (
          <StatusBadge variant="success">Activo</StatusBadge>
        ) : (
          <StatusBadge variant="neutral">Inactivo</StatusBadge>
        )}
      </div>
    </Card>
  );
}

export function TablaEstudiantes({ secciones }: Props) {
  const [seccionId, setSeccionId] = useState("");
  const [estudiantes, setEstudiantes] = useState<EstudianteResumen[]>([]);
  const [cargandoRoster, setCargandoRoster] = useState(false);
  const [cargandoEditarId, setCargandoEditarId] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  const [abierto, setAbierto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState<EstudianteProps | null>(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    documento: "",
    nombreCompleto: "",
    fechaNacimiento: "",
    apoderadoNombre: "",
    apoderadoTelefono: "",
    apoderadoParentesco: "",
  });

  const seccionesOrdenadas = useMemo(() => [...secciones].sort(compararSecciones), [secciones]);
  const seccionesPorNivel = useMemo(() => {
    const grupos = new Map<NivelEducativo, SeccionProps[]>();
    for (const s of seccionesOrdenadas) {
      if (!grupos.has(s.nivel)) grupos.set(s.nivel, []);
      grupos.get(s.nivel)!.push(s);
    }
    return grupos;
  }, [seccionesOrdenadas]);
  const seccionActual = secciones.find((s) => s.id === seccionId) ?? null;
  const permiteFoto = seccionActual !== null && seccionActual.nivel !== NIVELES_EDUCATIVOS.INICIAL;

  useEffect(() => {
    return () => {
      if (fotoPreviewUrl) URL.revokeObjectURL(fotoPreviewUrl);
    };
  }, [fotoPreviewUrl]);

  async function cargarRoster(id: string) {
    setCargandoRoster(true);
    const datos = await accionListarEstudiantesPorSeccion(id);
    setEstudiantes(datos);
    setCargandoRoster(false);
  }

  function onCambiarSeccion(id: string) {
    setSeccionId(id);
    setBusqueda("");
    if (id) cargarRoster(id);
    else setEstudiantes([]);
  }

  function abrirCrear() {
    setEditando(null);
    setForm({ documento: "", nombreCompleto: "", fechaNacimiento: "", apoderadoNombre: "", apoderadoTelefono: "", apoderadoParentesco: "" });
    setFotoPreviewUrl(null);
    setAbierto(true);
  }

  async function abrirEditar(resumen: EstudianteResumen) {
    setCargandoEditarId(resumen.id);
    const completo = await accionObtenerEstudiante(resumen.id);
    setCargandoEditarId(null);
    if (!completo) {
      toast.error("No se pudo cargar el estudiante");
      return;
    }
    setEditando(completo);
    setForm({
      documento: completo.documento,
      nombreCompleto: completo.nombreCompleto,
      fechaNacimiento: completo.fechaNacimiento,
      apoderadoNombre: completo.apoderado.nombre,
      apoderadoTelefono: completo.apoderado.telefono,
      apoderadoParentesco: completo.apoderado.parentesco,
    });
    setFotoPreviewUrl(null);
    setAbierto(true);
  }

  async function onFotoSeleccionada(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!archivo || !editando) return;

    setSubiendoFoto(true);
    try {
      const comprimida = await comprimirImagen(archivo);
      setFotoPreviewUrl(URL.createObjectURL(comprimida));
      const respuesta = await fetch(`/api/estudiantes/${editando.id}/foto`, {
        method: "POST",
        headers: { "Content-Type": "image/jpeg" },
        body: comprimida,
      });
      const datos = await respuesta.json();
      if (datos.ok) {
        toast.success("Foto actualizada. Falta que el script de enrolamiento calcule el encoding.");
        setEditando({ ...editando, encodingFacial: null, encodingActualizadoEn: null });
      } else {
        toast.error(datos.mensaje ?? "No se pudo subir la foto");
      }
    } catch {
      toast.error("No se pudo procesar/subir la foto");
    } finally {
      setSubiendoFoto(false);
    }
  }

  async function onSubmit() {
    setLoading(true);
    const apoderado = { nombre: form.apoderadoNombre, telefono: form.apoderadoTelefono, parentesco: form.apoderadoParentesco };
    let resultado;

    if (editando) {
      resultado = await accionActualizarEstudiante({
        id: editando.id,
        documento: form.documento,
        nombreCompleto: form.nombreCompleto,
        fechaNacimiento: form.fechaNacimiento,
        apoderado,
        activo: editando.activo,
      });
    } else if (seccionActual) {
      resultado = await accionCrearEstudianteEnSeccion({
        documento: form.documento,
        nombreCompleto: form.nombreCompleto,
        fechaNacimiento: form.fechaNacimiento,
        apoderado,
        seccionId: seccionActual.id,
        anio: seccionActual.anio,
      });
    } else {
      setLoading(false);
      return;
    }

    if (resultado.ok) {
      toast.success(resultado.mensaje);
      setAbierto(false);
      if (seccionId) cargarRoster(seccionId);
    } else {
      toast.error(resultado.mensaje);
    }
    setLoading(false);
  }

  async function onEliminar(id: string) {
    const resultado = await accionEliminarEstudiante(id);
    if (resultado.ok) {
      toast.success(resultado.mensaje);
      if (seccionId) cargarRoster(seccionId);
    } else {
      toast.error(resultado.mensaje);
    }
  }

  const estudiantesFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return estudiantes;
    return estudiantes.filter(
      (e) => e.nombreCompleto.toLowerCase().includes(termino) || e.documento.toLowerCase().includes(termino)
    );
  }, [estudiantes, busqueda]);

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Estudiantes</h1>
          <p className="text-sm text-muted-foreground">Administra la información de los estudiantes matriculados.</p>
        </div>
        <Button onClick={abrirCrear} disabled={!seccionActual}>
          <Plus className="size-4" />
          Nuevo estudiante
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={seccionId} onValueChange={(v) => v && onCambiarSeccion(v)}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Selecciona una sección" />
          </SelectTrigger>
          <SelectContent>
            {ORDEN_NIVELES_EDUCATIVOS.map((nivel) => {
              const secs = seccionesPorNivel.get(nivel);
              if (!secs || secs.length === 0) return null;
              return (
                <SelectGroup key={nivel}>
                  <SelectLabel>{ETIQUETAS_NIVEL_EDUCATIVO[nivel]}</SelectLabel>
                  {secs.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.grado} {s.nombre}
                    </SelectItem>
                  ))}
                </SelectGroup>
              );
            })}
          </SelectContent>
        </Select>

        {seccionActual && (
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o documento..."
              className="pl-8"
            />
          </div>
        )}
      </div>

      {!seccionActual ? (
        <p className="p-6 text-center text-sm text-muted-foreground">Selecciona una sección para ver sus alumnos.</p>
      ) : cargandoRoster ? (
        <p className="p-6 text-center text-sm text-muted-foreground">Cargando alumnos...</p>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {estudiantesFiltrados.map((e) => (
              <TarjetaEstudiante key={e.id} estudiante={e} onEditar={abrirEditar} onEliminar={onEliminar} />
            ))}
            {estudiantesFiltrados.length === 0 && (
              <p className="p-6 text-center text-sm text-muted-foreground">No hay alumnos matriculados en esta sección.</p>
            )}
          </div>

          <Card className="hidden p-0 md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Apoderado</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estudiantesFiltrados.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.nombreCompleto}</TableCell>
                      <TableCell className="text-muted-foreground">{e.documento}</TableCell>
                      <TableCell className="text-muted-foreground">{e.apoderado.nombre}</TableCell>
                      <TableCell>
                        {e.activo ? (
                          <StatusBadge variant="success">Activo</StatusBadge>
                        ) : (
                          <StatusBadge variant="neutral">Inactivo</StatusBadge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => abrirEditar(e)} disabled={cargandoEditarId === e.id}>
                            <Pencil className="size-3.5" />
                            {cargandoEditarId === e.id ? "Cargando..." : "Editar"}
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => onEliminar(e.id)}>
                            <Trash2 className="size-3.5" />
                            Eliminar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {estudiantesFiltrados.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No hay alumnos matriculados en esta sección.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Estudiante" : "Nuevo Estudiante"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Documento</Label>
              <Input value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} placeholder="DNI" />
            </div>
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              <Input value={form.nombreCompleto} onChange={(e) => setForm({ ...form, nombreCompleto: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Fecha de nacimiento</Label>
              <Input type="date" value={form.fechaNacimiento} onChange={(e) => setForm({ ...form, fechaNacimiento: e.target.value })} />
            </div>

            {editando && permiteFoto && (
              <>
                <Separator />
                <p className="text-sm font-medium text-muted-foreground">Foto para reconocimiento facial</p>
                <div className="flex items-center gap-3">
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted ring-1 ring-foreground/10">
                    {fotoPreviewUrl || editando.fotoBase64 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={fotoPreviewUrl ?? `data:${editando.fotoContentType};base64,${editando.fotoBase64}`}
                        alt="Foto del alumno"
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Sin foto</span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="foto-estudiante" className="cursor-pointer">
                      <span className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
                        <Upload className="size-3.5" />
                        {subiendoFoto ? "Subiendo..." : "Subir foto"}
                      </span>
                    </Label>
                    <input
                      id="foto-estudiante"
                      type="file"
                      accept="image/jpeg,image/png"
                      className="hidden"
                      disabled={subiendoFoto}
                      onChange={onFotoSeleccionada}
                    />
                    <p className="text-xs text-muted-foreground">
                      {editando.encodingFacial
                        ? "Rostro enrolado."
                        : editando.fotoBase64
                          ? "Foto lista, pendiente de que el script de enrolamiento calcule el encoding."
                          : "Sin foto todavía."}
                    </p>
                  </div>
                </div>
              </>
            )}

            <Separator />
            <p className="text-sm font-medium text-muted-foreground">Datos del apoderado</p>
            <div className="space-y-2">
              <Label>Nombre del apoderado</Label>
              <Input value={form.apoderadoNombre} onChange={(e) => setForm({ ...form, apoderadoNombre: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input value={form.apoderadoTelefono} onChange={(e) => setForm({ ...form, apoderadoTelefono: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Parentesco</Label>
              <Input value={form.apoderadoParentesco} onChange={(e) => setForm({ ...form, apoderadoParentesco: e.target.value })} placeholder="Ej: Madre, Padre, Tutor" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={onSubmit} disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
