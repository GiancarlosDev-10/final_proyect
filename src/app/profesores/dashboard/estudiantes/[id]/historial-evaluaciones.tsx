"use client";

import { useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { normalizarTexto } from "@/compartido/lib/normalizar-texto";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface FilaEvaluacion {
  id: string;
  cursoNombre: string;
  periodoNombre: string;
  tipoEtiqueta: string;
  fecha: string;
  valor: number;
}

interface Props {
  notas: FilaEvaluacion[];
  notaAprobatoria: number;
}

const TAMANO_PAGINA = 10;

export function HistorialEvaluaciones({ notas, notaAprobatoria }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);

  const notasFiltradas = useMemo(() => {
    const termino = normalizarTexto(busqueda);
    if (!termino) return notas;
    return notas.filter(
      (n) =>
        normalizarTexto(n.cursoNombre).includes(termino) ||
        normalizarTexto(n.tipoEtiqueta).includes(termino)
    );
  }, [notas, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(notasFiltradas.length / TAMANO_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const notasPagina = useMemo(
    () => notasFiltradas.slice((paginaActual - 1) * TAMANO_PAGINA, paginaActual * TAMANO_PAGINA),
    [notasFiltradas, paginaActual]
  );

  function onCambiarBusqueda(valor: string) {
    setBusqueda(valor);
    setPagina(1);
  }

  return (
    <Card className="p-0">
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-base">Historial de evaluaciones</CardTitle>
        <p className="text-sm font-normal text-muted-foreground">
          Notas registradas en tus cursos. Escala de 0 a 20; aprobatoria desde {notaAprobatoria}.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-2">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(e) => onCambiarBusqueda(e.target.value)}
            placeholder="Buscar por curso o tipo de prueba..."
            className="pl-8"
          />
        </div>

        <div className="space-y-3 md:hidden">
          {notasPagina.map((n) => (
            <Card key={n.id} className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{n.cursoNombre}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {n.tipoEtiqueta} · {n.periodoNombre} · {n.fecha}
                  </p>
                </div>
                <StatusBadge variant={n.valor >= notaAprobatoria ? "success" : "error"} className="shrink-0">
                  {n.valor}
                </StatusBadge>
              </div>
            </Card>
          ))}
          {notasFiltradas.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              {notas.length === 0
                ? "Aún no hay notas registradas para este estudiante en tus cursos."
                : "Ninguna evaluación coincide con la búsqueda."}
            </p>
          )}
        </div>

        <div className="hidden md:block">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">Curso</TableHead>
                <TableHead className="w-32">Periodo</TableHead>
                <TableHead className="w-32">Tipo de Prueba</TableHead>
                <TableHead className="w-28">Fecha</TableHead>
                <TableHead className="w-20 text-center">Nota</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notasPagina.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="truncate font-medium">{n.cursoNombre}</TableCell>
                  <TableCell className="truncate text-muted-foreground">{n.periodoNombre}</TableCell>
                  <TableCell className="truncate text-muted-foreground">{n.tipoEtiqueta}</TableCell>
                  <TableCell className="text-muted-foreground">{n.fecha}</TableCell>
                  <TableCell className="text-center">
                    <StatusBadge variant={n.valor >= notaAprobatoria ? "success" : "error"}>{n.valor}</StatusBadge>
                  </TableCell>
                </TableRow>
              ))}
              {notasFiltradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    {notas.length === 0
                      ? "Aún no hay notas registradas para este estudiante en tus cursos."
                      : "Ninguna evaluación coincide con la búsqueda."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {notasFiltradas.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Mostrando {(paginaActual - 1) * TAMANO_PAGINA + 1}–
              {Math.min(paginaActual * TAMANO_PAGINA, notasFiltradas.length)} de {notasFiltradas.length} evaluaciones
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
  );
}
