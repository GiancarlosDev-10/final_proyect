"use client";

import { useState } from "react";
import { EstudianteProps } from "@/modulos/estudiantes/dominio/estudiante";
import { AreaProps } from "@/modulos/areas/dominio/area";
import { PeriodoProps } from "@/modulos/periodos/dominio/periodo";
import { CursoProps } from "@/modulos/cursos/dominio/curso";
import { SeccionProps } from "@/modulos/secciones/dominio/seccion";
import { MatriculaProps } from "@/modulos/matriculas/dominio/matricula";
import { TablaReportePromedios } from "@/modulos/reportes/presentacion/tabla-reporte-promedios";
import { TablaConsolidadoSeccion } from "@/modulos/reportes/presentacion/tabla-consolidado-seccion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  estudiantes: EstudianteProps[];
  areas: AreaProps[];
  periodos: PeriodoProps[];
  cursos: CursoProps[];
  secciones: SeccionProps[];
  matriculas: MatriculaProps[];
}

type Vista = "individual" | "consolidado";

export function ReportesShell({ estudiantes, areas, periodos, cursos, secciones, matriculas }: Props) {
  const [vista, setVista] = useState<Vista>("individual");

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Reportes</h1>
        <p className="text-sm text-muted-foreground">Consulta promedios individuales o el consolidado de una sección.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={vista === "individual" ? "default" : "outline"}
          onClick={() => setVista("individual")}
          className={cn(vista !== "individual" && "text-muted-foreground")}
        >
          Por Estudiante
        </Button>
        <Button
          variant={vista === "consolidado" ? "default" : "outline"}
          onClick={() => setVista("consolidado")}
          className={cn(vista !== "consolidado" && "text-muted-foreground")}
        >
          Consolidado por Sección
        </Button>
        <Badge variant="secondary">Solo lectura</Badge>
      </div>

      <p className="text-sm text-muted-foreground">
        {vista === "individual"
          ? "Promedio bimestral de un estudiante en un área, calculado a partir de sus notas por unidad didáctica."
          : "Todos los cursos de una sección en una sola tabla, con puntaje y orden de mérito."}
      </p>

      {vista === "individual" ? (
        <TablaReportePromedios
          estudiantes={estudiantes}
          areas={areas}
          periodos={periodos}
          cursos={cursos}
          secciones={secciones}
          matriculas={matriculas}
        />
      ) : (
        <TablaConsolidadoSeccion secciones={secciones} periodos={periodos} cursos={cursos} estudiantes={estudiantes} />
      )}
    </div>
  );
}
