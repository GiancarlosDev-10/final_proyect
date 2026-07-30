"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { EstudianteProps } from "@/modulos/estudiantes/dominio/estudiante";
import { AreaProps } from "@/modulos/areas/dominio/area";
import { PeriodoProps } from "@/modulos/periodos/dominio/periodo";
import { CursoProps } from "@/modulos/cursos/dominio/curso";
import { SeccionProps } from "@/modulos/secciones/dominio/seccion";
import { MatriculaProps } from "@/modulos/matriculas/dominio/matricula";
import { PromedioArea } from "@/modulos/reportes/aplicacion/calcular-promedio-area";
import { accionCalcularPromedioArea } from "@/modulos/reportes/presentacion/acciones";
import { apellidoNombre } from "@/compartido/lib/formatear-nombre";
import { NivelEducativo, ORDEN_NIVELES_EDUCATIVOS, ETIQUETAS_NIVEL_EDUCATIVO } from "@/config/constantes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  estudiantes: EstudianteProps[];
  areas: AreaProps[];
  periodos: PeriodoProps[];
  cursos: CursoProps[];
  secciones: SeccionProps[];
  matriculas: MatriculaProps[];
}

function formatearPromedio(valor: number | null): string {
  return valor === null ? "—" : valor.toFixed(1);
}

function numeroDeGrado(grado: string): number {
  const match = grado.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

export function TablaReportePromedios({ estudiantes, areas, periodos, cursos, secciones, matriculas }: Props) {
  const [nivelFiltro, setNivelFiltro] = useState<NivelEducativo | "">("");
  const [gradoFiltro, setGradoFiltro] = useState("");
  const [seccionId, setSeccionId] = useState("");
  const [estudianteId, setEstudianteId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [periodoId, setPeriodoId] = useState("");
  const [reporte, setReporte] = useState<PromedioArea | null>(null);
  const [loading, setLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);

  // Nivel → Grado → Sección → Estudiante: sin acotar por sección, "Estudiante"
  // mostraba a los ~500 alumnos del colegio en una sola lista plana.
  const nivelesDisponibles = useMemo(() => {
    const niveles = new Set(secciones.map((s) => s.nivel));
    return ORDEN_NIVELES_EDUCATIVOS.filter((n) => niveles.has(n));
  }, [secciones]);

  const gradosDisponibles = useMemo(() => {
    const base = nivelFiltro ? secciones.filter((s) => s.nivel === nivelFiltro) : secciones;
    return [...new Set(base.map((s) => s.grado))].sort((a, b) => numeroDeGrado(a) - numeroDeGrado(b));
  }, [secciones, nivelFiltro]);

  const seccionesFiltradas = useMemo(() => {
    return secciones.filter(
      (s) => (!nivelFiltro || s.nivel === nivelFiltro) && (!gradoFiltro || s.grado === gradoFiltro)
    );
  }, [secciones, nivelFiltro, gradoFiltro]);

  function onCambiarNivel(valor: string) {
    setNivelFiltro(valor as NivelEducativo | "");
    setGradoFiltro("");
    setSeccionId("");
    setEstudianteId("");
  }

  function onCambiarGrado(valor: string) {
    setGradoFiltro(valor);
    setSeccionId("");
    setEstudianteId("");
  }

  function onCambiarSeccion(valor: string) {
    setSeccionId(valor);
    setEstudianteId("");
  }

  async function onBuscar() {
    if (!estudianteId || !areaId || !periodoId) return;
    setLoading(true);
    const resultado = await accionCalcularPromedioArea({ estudianteId, areaId, periodoId });
    setReporte(resultado);
    setBuscado(true);
    setLoading(false);
  }

  function nombreEstudiante(id: string) {
    const e = estudiantes.find((e) => e.id === id);
    return e ? apellidoNombre(e.nombreCompleto) : "(estudiante eliminado)";
  }

  function nombreSeccion(id: string) {
    const s = secciones.find((s) => s.id === id);
    return s ? `${s.grado} ${s.nombre}` : "(sección eliminada)";
  }

  // Vacío hasta elegir una sección — evita ofrecer a los ~500 alumnos del
  // colegio de una sola vez.
  const estudiantesFiltrados = useMemo(() => {
    if (!seccionId) return [];
    const idsMatriculados = new Set(
      matriculas.filter((m) => m.seccionId === seccionId && m.activo).map((m) => m.estudianteId)
    );
    return estudiantes
      .filter((e) => idsMatriculados.has(e.id))
      .sort((a, b) => apellidoNombre(a.nombreCompleto).localeCompare(apellidoNombre(b.nombreCompleto), "es"));
  }, [estudiantes, matriculas, seccionId]);

  function nombreArea(id: string) {
    return areas.find((a) => a.id === id)?.nombre || "(área eliminada)";
  }

  function nombrePeriodo(id: string) {
    const p = periodos.find((p) => p.id === id);
    if (!p) return "(periodo eliminado)";
    return p.nombre.match(/\d+/)?.[0] ?? p.nombre;
  }

  function nombreCurso(id: string) {
    return cursos.find((c) => c.id === id)?.nombre || "(curso eliminado)";
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="w-36 space-y-2">
              <Label>Nivel</Label>
              <Select
                value={nivelFiltro}
                onValueChange={(v) => onCambiarNivel(v ?? "")}
                itemToStringLabel={(n) => (n ? ETIQUETAS_NIVEL_EDUCATIVO[n as NivelEducativo] : "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Nivel" />
                </SelectTrigger>
                <SelectContent>
                  {nivelesDisponibles.map((n) => (
                    <SelectItem key={n} value={n}>{ETIQUETAS_NIVEL_EDUCATIVO[n]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-28 space-y-2">
              <Label>Grado</Label>
              <Select value={gradoFiltro} onValueChange={(v) => onCambiarGrado(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Grado" />
                </SelectTrigger>
                <SelectContent>
                  {gradosDisponibles.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <Label>Sección</Label>
              <Select value={seccionId} onValueChange={(v) => onCambiarSeccion(v ?? "")} itemToStringLabel={nombreSeccion}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar sección" />
                </SelectTrigger>
                <SelectContent>
                  {seccionesFiltradas.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.grado} {s.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <Label>Estudiante</Label>
              <Select
                value={estudianteId}
                onValueChange={(v) => setEstudianteId(v ?? "")}
                itemToStringLabel={nombreEstudiante}
                disabled={!seccionId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={seccionId ? "Seleccionar estudiante" : "Elige una sección primero"} />
                </SelectTrigger>
                <SelectContent>
                  {estudiantesFiltrados.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{apellidoNombre(e.nombreCompleto)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <Label>Área</Label>
              <Select value={areaId} onValueChange={(v) => setAreaId(v ?? "")} itemToStringLabel={nombreArea}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar área" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-32 space-y-2">
              <Label>Periodo</Label>
              <Select value={periodoId} onValueChange={(v) => setPeriodoId(v ?? "")} itemToStringLabel={nombrePeriodo}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Periodo" />
                </SelectTrigger>
                <SelectContent>
                  {periodos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{nombrePeriodo(p.id)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mt-1.5 flex h-8 items-center self-center">
              <Button className="h-8" onClick={onBuscar} disabled={!estudianteId || !areaId || !periodoId || loading}>
                <Search className="size-4" />
                {loading ? "Calculando..." : "Ver reporte"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {buscado && !reporte && (
        <p className="text-sm text-muted-foreground">No se pudo calcular el reporte.</p>
      )}

      {buscado && reporte && (
        <Card className="p-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Curso</TableHead>
                  <TableHead>Unidad 1</TableHead>
                  <TableHead>Unidad 2</TableHead>
                  <TableHead>Promedio Bimestral</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reporte.cursos.map((c) => (
                  <TableRow key={c.cursoId}>
                    <TableCell className="font-medium">{nombreCurso(c.cursoId)}</TableCell>
                    {[1, 2].map((orden) => (
                      <TableCell key={orden} className="text-muted-foreground">
                        {formatearPromedio(c.promediosPorUnidad.find((p) => p.orden === orden)?.promedio ?? null)}
                      </TableCell>
                    ))}
                    <TableCell className="font-semibold">{formatearPromedio(c.promedioBimestral)}</TableCell>
                  </TableRow>
                ))}
                {reporte.cursos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No hay cursos registrados en esta área.
                    </TableCell>
                  </TableRow>
                )}
                <TableRow className="bg-muted/40">
                  <TableCell className="font-semibold">Promedio del Área</TableCell>
                  {[1, 2].map((orden) => (
                    <TableCell key={orden} className="font-semibold">
                      {formatearPromedio(reporte.promediosPorUnidad.find((p) => p.orden === orden)?.promedio ?? null)}
                    </TableCell>
                  ))}
                  <TableCell className="font-bold">{formatearPromedio(reporte.promedioBimestral)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
