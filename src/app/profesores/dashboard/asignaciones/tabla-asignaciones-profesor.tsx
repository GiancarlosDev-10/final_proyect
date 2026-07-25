"use client";

import { useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { AsignacionProps } from "@/modulos/asignaciones/dominio/asignacion";
import { CursoProps } from "@/modulos/cursos/dominio/curso";
import { SeccionProps } from "@/modulos/secciones/dominio/seccion";
import { PeriodoProps } from "@/modulos/periodos/dominio/periodo";
import { compararSecciones } from "@/modulos/secciones/dominio/orden-secciones";
import { ETIQUETAS_NIVEL_EDUCATIVO } from "@/config/constantes";
import { normalizarTexto } from "@/compartido/lib/normalizar-texto";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Props {
  asignaciones: AsignacionProps[];
  cursos: CursoProps[];
  secciones: SeccionProps[];
  periodos: PeriodoProps[];
}

const TAMANO_PAGINA = 10;

function numeroDePeriodo(nombre: string): string {
  const match = nombre.match(/\d+/);
  return match ? match[0] : nombre;
}

function TarjetaAsignacion({
  asignacion,
  nombreCurso,
  nombreNivel,
  nombreGrado,
  nombreLetraSeccion,
  nombrePeriodo,
}: {
  asignacion: AsignacionProps;
  nombreCurso: (id: string) => string;
  nombreNivel: (id: string) => string;
  nombreGrado: (id: string) => string;
  nombreLetraSeccion: (id: string) => string;
  nombrePeriodo: (id: string) => string;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{nombreCurso(asignacion.cursoId)}</p>
          <p className="truncate text-sm text-muted-foreground">
            {nombreNivel(asignacion.seccionId)} · {nombreGrado(asignacion.seccionId)} {nombreLetraSeccion(asignacion.seccionId)}
          </p>
          <p className="truncate text-sm text-muted-foreground">{nombrePeriodo(asignacion.periodoId)}</p>
        </div>
        {asignacion.activo ? (
          <Badge className="shrink-0 border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Activo</Badge>
        ) : (
          <Badge variant="secondary" className="shrink-0">Inactivo</Badge>
        )}
      </div>
    </Card>
  );
}

export function TablaAsignacionesProfesor({ asignaciones, cursos, secciones, periodos }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);

  function nombreCurso(id: string) {
    return cursos.find((c) => c.id === id)?.nombre ?? "(curso eliminado)";
  }

  function nombreNivel(seccionId: string) {
    const s = secciones.find((s) => s.id === seccionId);
    return s ? ETIQUETAS_NIVEL_EDUCATIVO[s.nivel] : "—";
  }

  function nombreGrado(seccionId: string) {
    return secciones.find((s) => s.id === seccionId)?.grado ?? "—";
  }

  function nombreLetraSeccion(seccionId: string) {
    return secciones.find((s) => s.id === seccionId)?.nombre ?? "—";
  }

  function nombreSeccionCompleta(seccionId: string) {
    const s = secciones.find((s) => s.id === seccionId);
    return s ? `${s.grado} ${s.nombre}` : "(sección eliminada)";
  }

  function nombrePeriodo(id: string) {
    const p = periodos.find((p) => p.id === id);
    return p ? `${p.nombre} ${p.anio}` : "(periodo eliminado)";
  }

  const asignacionesFiltradas = useMemo(() => {
    const termino = normalizarTexto(busqueda);
    const base = !termino
      ? asignaciones
      : asignaciones.filter(
          (a) =>
            normalizarTexto(nombreCurso(a.cursoId)).includes(termino) ||
            normalizarTexto(nombreSeccionCompleta(a.seccionId)).includes(termino) ||
            normalizarTexto(nombreNivel(a.seccionId)).includes(termino) ||
            normalizarTexto(nombrePeriodo(a.periodoId)).includes(termino)
        );
    // Dentro de un mismo curso, ordena por nivel → grado numérico → sección
    // (A/B), en vez del orden de inserción, para que se lea 1°A, 1°B, 2°A...
    return [...base].sort((a, b) => {
      const porCurso = nombreCurso(a.cursoId).localeCompare(nombreCurso(b.cursoId), "es");
      if (porCurso !== 0) return porCurso;
      const seccionA = secciones.find((s) => s.id === a.seccionId);
      const seccionB = secciones.find((s) => s.id === b.seccionId);
      return seccionA && seccionB ? compararSecciones(seccionA, seccionB) : 0;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asignaciones, busqueda, cursos, secciones, periodos]);

  const totalPaginas = Math.max(1, Math.ceil(asignacionesFiltradas.length / TAMANO_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const asignacionesPagina = useMemo(
    () => asignacionesFiltradas.slice((paginaActual - 1) * TAMANO_PAGINA, paginaActual * TAMANO_PAGINA),
    [asignacionesFiltradas, paginaActual]
  );

  function onCambiarBusqueda(valor: string) {
    setBusqueda(valor);
    setPagina(1);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Mis Asignaciones</h1>
        <p className="text-sm text-muted-foreground">Cursos y secciones que tienes a cargo.</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busqueda}
          onChange={(e) => onCambiarBusqueda(e.target.value)}
          placeholder="Buscar por curso, sección o periodo..."
          className="pl-8"
        />
      </div>

      <div className="space-y-3 md:hidden">
        {asignacionesPagina.map((a) => (
          <TarjetaAsignacion
            key={a.id}
            asignacion={a}
            nombreCurso={nombreCurso}
            nombreNivel={nombreNivel}
            nombreGrado={nombreGrado}
            nombreLetraSeccion={nombreLetraSeccion}
            nombrePeriodo={nombrePeriodo}
          />
        ))}
        {asignacionesFiltradas.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {asignaciones.length === 0 ? "No tienes asignaciones activas." : "Ninguna asignación coincide con la búsqueda."}
          </p>
        )}
      </div>

      <Card className="hidden p-0 md:block">
        <CardContent className="p-0">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">Curso</TableHead>
                <TableHead className="w-28">Nivel</TableHead>
                <TableHead className="w-20">Grado</TableHead>
                <TableHead className="w-20">Sección</TableHead>
                <TableHead className="w-20 text-center">Periodo</TableHead>
                <TableHead className="w-24 text-center">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {asignacionesPagina.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="truncate font-medium">{nombreCurso(a.cursoId)}</TableCell>
                  <TableCell className="truncate text-muted-foreground">{nombreNivel(a.seccionId)}</TableCell>
                  <TableCell className="text-muted-foreground">{nombreGrado(a.seccionId)}</TableCell>
                  <TableCell className="text-muted-foreground">{nombreLetraSeccion(a.seccionId)}</TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {numeroDePeriodo(periodos.find((p) => p.id === a.periodoId)?.nombre ?? "—")}
                  </TableCell>
                  <TableCell className="text-center">
                    {a.activo ? (
                      <Badge className="border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Activo</Badge>
                    ) : (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {asignacionesFiltradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {asignaciones.length === 0 ? "No tienes asignaciones activas." : "Ninguna asignación coincide con la búsqueda."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {asignacionesFiltradas.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Mostrando {(paginaActual - 1) * TAMANO_PAGINA + 1}–
            {Math.min(paginaActual * TAMANO_PAGINA, asignacionesFiltradas.length)} de {asignacionesFiltradas.length} asignaciones
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
    </div>
  );
}
