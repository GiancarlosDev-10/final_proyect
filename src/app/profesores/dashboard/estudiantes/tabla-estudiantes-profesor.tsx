"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { EstudianteProps } from "@/modulos/estudiantes/dominio/estudiante";
import { normalizarTexto } from "@/compartido/lib/normalizar-texto";
import { apellidoNombre } from "@/compartido/lib/formatear-nombre";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Props {
  estudiantes: EstudianteProps[];
}

const TAMANO_PAGINA = 10;

function TarjetaEstudiante({ estudiante }: { estudiante: EstudianteProps }) {
  return (
    <Card className="p-3">
      <div className="min-w-0">
        <p className="truncate font-medium">{apellidoNombre(estudiante.nombreCompleto)}</p>
        <p className="truncate text-sm text-muted-foreground">Documento: {estudiante.documento}</p>
        <p className="truncate text-sm text-muted-foreground">Apoderado: {estudiante.apoderado.nombre}</p>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        {estudiante.activo ? (
          <StatusBadge variant="success">Activo</StatusBadge>
        ) : (
          <StatusBadge variant="neutral">Inactivo</StatusBadge>
        )}
        <Link
          href={`/profesores/dashboard/estudiantes/${estudiante.id}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Eye className="size-3.5" />
          Ver detalles
        </Link>
      </div>
    </Card>
  );
}

export function TablaEstudiantesProfesor({ estudiantes }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);

  const estudiantesFiltrados = useMemo(() => {
    const termino = normalizarTexto(busqueda);
    const base = !termino
      ? estudiantes
      : estudiantes.filter(
          (e) => normalizarTexto(e.nombreCompleto).includes(termino) || normalizarTexto(e.documento).includes(termino)
        );
    return [...base].sort((a, b) => apellidoNombre(a.nombreCompleto).localeCompare(apellidoNombre(b.nombreCompleto), "es"));
  }, [estudiantes, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(estudiantesFiltrados.length / TAMANO_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const estudiantesPagina = useMemo(
    () => estudiantesFiltrados.slice((paginaActual - 1) * TAMANO_PAGINA, paginaActual * TAMANO_PAGINA),
    [estudiantesFiltrados, paginaActual]
  );

  function onCambiarBusqueda(valor: string) {
    setBusqueda(valor);
    setPagina(1);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Mis Estudiantes</h1>
        <p className="text-sm text-muted-foreground">Estudiantes matriculados en tus secciones asignadas.</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busqueda}
          onChange={(e) => onCambiarBusqueda(e.target.value)}
          placeholder="Buscar por nombre o documento..."
          className="pl-8"
        />
      </div>

      <div className="space-y-3 md:hidden">
        {estudiantesPagina.map((e) => (
          <TarjetaEstudiante key={e.id} estudiante={e} />
        ))}
        {estudiantesFiltrados.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {estudiantes.length === 0 ? "No tienes estudiantes asignados." : "Ningún estudiante coincide con la búsqueda."}
          </p>
        )}
      </div>

      <Card className="hidden p-0 md:block">
        <CardContent className="p-0">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">Nombre</TableHead>
                <TableHead className="w-32">Documento</TableHead>
                <TableHead className="w-48">Apoderado</TableHead>
                <TableHead className="w-24 text-center">Estado</TableHead>
                <TableHead className="w-40 text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estudiantesPagina.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="truncate font-medium">{apellidoNombre(e.nombreCompleto)}</TableCell>
                  <TableCell className="truncate text-muted-foreground">{e.documento}</TableCell>
                  <TableCell className="truncate text-muted-foreground">{e.apoderado.nombre}</TableCell>
                  <TableCell className="text-center">
                    {e.activo ? (
                      <StatusBadge variant="success">Activo</StatusBadge>
                    ) : (
                      <StatusBadge variant="neutral">Inactivo</StatusBadge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <Link
                        href={`/profesores/dashboard/estudiantes/${e.id}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        <Eye className="size-3.5" />
                        Ver detalles
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {estudiantesFiltrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    {estudiantes.length === 0 ? "No tienes estudiantes asignados." : "Ningún estudiante coincide con la búsqueda."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {estudiantesFiltrados.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Mostrando {(paginaActual - 1) * TAMANO_PAGINA + 1}–
            {Math.min(paginaActual * TAMANO_PAGINA, estudiantesFiltrados.length)} de {estudiantesFiltrados.length} alumnos
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
