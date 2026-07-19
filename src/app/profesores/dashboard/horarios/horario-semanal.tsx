"use client";

import { Fragment, useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BloqueHorarioProps } from "@/modulos/horarios/dominio/bloque-horario";
import { AsignacionProps } from "@/modulos/asignaciones/dominio/asignacion";
import { CursoProps } from "@/modulos/cursos/dominio/curso";
import { SeccionProps } from "@/modulos/secciones/dominio/seccion";
import { RecordatorioProps } from "@/modulos/recordatorios/dominio/recordatorio";
import { COLORES_TIPO_RECORDATORIO } from "@/modulos/recordatorios/presentacion/estilos";
import { accionMoverRecordatorio } from "@/app/profesores/dashboard/recordatorios/acciones";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ORDEN_DIAS_SEMANA, PERIODOS_HORARIO, DiaSemana, PeriodoHorario } from "@/config/constantes";
import { cn } from "@/lib/utils";

interface Props {
  bloques: BloqueHorarioProps[];
  asignaciones: AsignacionProps[];
  cursos: CursoProps[];
  secciones: SeccionProps[];
  recordatorios: RecordatorioProps[];
}

const ETIQUETAS_DIA: Record<DiaSemana, string> = {
  LUNES: "Lunes",
  MARTES: "Martes",
  MIERCOLES: "Miércoles",
  JUEVES: "Jueves",
  VIERNES: "Viernes",
};

function obtenerLunes(fecha: Date): Date {
  const copia = new Date(fecha);
  const dia = copia.getDay();
  const diferencia = dia === 0 ? -6 : 1 - dia;
  copia.setDate(copia.getDate() + diferencia);
  copia.setHours(0, 0, 0, 0);
  return copia;
}

function sumarDias(fecha: Date, dias: number): Date {
  const copia = new Date(fecha);
  copia.setDate(copia.getDate() + dias);
  return copia;
}

function formatearISO(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
  const dia = fecha.getDate().toString().padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function formatearEtiqueta(fecha: Date): string {
  return fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit" });
}

function iniciarArrastreRecordatorio(e: DragEvent, id: string) {
  e.dataTransfer.setData("text/plain", id);
}

function TarjetaRecordatorio({ recordatorio }: { recordatorio: RecordatorioProps }) {
  return (
    <div
      draggable
      onDragStart={(e) => iniciarArrastreRecordatorio(e, recordatorio.id)}
      className={cn(
        "flex w-full items-center justify-center cursor-grab rounded border p-1.5 text-center text-[11px] active:cursor-grabbing",
        COLORES_TIPO_RECORDATORIO[recordatorio.tipo]
      )}
    >
      <p className="w-full truncate font-medium">{recordatorio.titulo}</p>
    </div>
  );
}

export function HorarioSemanal({ bloques, asignaciones, cursos, secciones, recordatorios }: Props) {
  const router = useRouter();
  const [lunesActual, setLunesActual] = useState(() => obtenerLunes(new Date()));

  const dias = ORDEN_DIAS_SEMANA.map((dia, indice) => ({ dia, fecha: sumarDias(lunesActual, indice) }));

  function nombreCurso(id: string) {
    return cursos.find((c) => c.id === id)?.nombre || "(curso eliminado)";
  }

  function nombreSeccion(id: string) {
    const s = secciones.find((s) => s.id === id);
    return s ? `${s.grado} ${s.nombre}` : "(sección eliminada)";
  }

  async function onMoverRecordatorio(recordatorioId: string, fecha: Date, periodo: PeriodoHorario | null) {
    const resultado = await accionMoverRecordatorio({
      id: recordatorioId,
      fecha: formatearISO(fecha),
      horaInicio: periodo?.horaInicio,
      horaFin: periodo?.horaFin,
    });
    if (resultado.ok) {
      toast.success(resultado.mensaje);
      router.refresh();
    } else {
      toast.error(resultado.mensaje);
    }
  }

  // El horario de clases lo define el área académica; el profesor solo puede
  // arrastrar sus propios recordatorios sobre él, nunca mover ni crear clases.
  function onSoltarEnCeldaHora(e: DragEvent<HTMLElement>, fecha: Date, periodo: PeriodoHorario) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    onMoverRecordatorio(id, fecha, periodo);
  }

  function onSoltarEnFilaRecordatorios(e: DragEvent<HTMLElement>, fecha: Date) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    onMoverRecordatorio(id, fecha, null);
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Mi Horario</h1>
          <p className="text-sm text-muted-foreground">Tu horario de clases lo define el área académica. Arrastra un recordatorio a una casilla de hora para asignarle horario, o de vuelta a la fila de abajo para quitárselo.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setLunesActual(sumarDias(lunesActual, -7))}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm font-medium">
            Semana del {formatearEtiqueta(dias[0].fecha)} al {formatearEtiqueta(dias[4].fecha)}
          </span>
          <Button variant="outline" size="sm" onClick={() => setLunesActual(sumarDias(lunesActual, 7))}>
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setLunesActual(obtenerLunes(new Date()))}>
            Hoy
          </Button>
        </div>
      </div>

      <Card className="p-0">
        <CardContent className="overflow-x-auto p-2">
          <div className="grid min-w-[720px] grid-cols-[6rem_repeat(5,minmax(0,1fr))] text-sm">
            <div className="border-b border-sidebar-border bg-sidebar p-2 text-left text-xs font-medium text-sidebar-foreground">Hora</div>
            {dias.map(({ dia, fecha }) => (
              <div key={dia} className="border-b border-sidebar-border bg-sidebar p-2 text-center">
                <div className="font-medium text-sidebar-foreground">{ETIQUETAS_DIA[dia]}</div>
                <div className="text-xs font-normal text-sidebar-foreground/70">{formatearEtiqueta(fecha)}</div>
              </div>
            ))}

            {PERIODOS_HORARIO.map((periodo) => (
              <Fragment key={periodo.horaInicio}>
                <div className="border-b border-sidebar-border bg-sidebar p-2 text-xs font-medium text-sidebar-foreground">
                  {periodo.horaInicio} - {periodo.horaFin}
                </div>
                {dias.map(({ dia, fecha }) => {
                  const bloque = bloques.find(
                    (b) => b.diaSemana === dia && b.horaInicio === periodo.horaInicio && b.horaFin === periodo.horaFin
                  );
                  const asignacion = bloque ? asignaciones.find((a) => a.id === bloque.asignacionId) : null;
                  const fechaISO = formatearISO(fecha);
                  const recordatoriosDeLaCelda = recordatorios.filter(
                    (r) => r.fecha === fechaISO && r.horaInicio === periodo.horaInicio && r.horaFin === periodo.horaFin
                  );

                  return (
                    <div
                      key={dia}
                      className="flex flex-col items-center gap-1 border-b p-1"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => onSoltarEnCeldaHora(e, fecha, periodo)}
                    >
                      {bloque ? (
                        <div className="flex min-h-12 w-full flex-col items-center justify-center overflow-hidden rounded-md border border-primary/30 bg-primary/10 px-4 py-2 text-center">
                          {asignacion ? (
                            <>
                              <p className="w-full truncate text-xs font-medium">{nombreCurso(asignacion.cursoId)}</p>
                              <p className="w-full truncate text-[11px] text-muted-foreground">{nombreSeccion(asignacion.seccionId)}</p>
                            </>
                          ) : (
                            <p className="w-full truncate text-xs text-muted-foreground">(asignación eliminada)</p>
                          )}
                        </div>
                      ) : recordatoriosDeLaCelda.length === 0 ? (
                        <div className="min-h-12 w-full rounded-md border border-dashed" />
                      ) : null}
                      {recordatoriosDeLaCelda.map((r) => (
                        <TarjetaRecordatorio key={r.id} recordatorio={r} />
                      ))}
                    </div>
                  );
                })}
              </Fragment>
            ))}

            <div className="p-2 text-xs font-medium text-muted-foreground">Recordatorios</div>
            {dias.map(({ dia, fecha }) => {
              const fechaISO = formatearISO(fecha);
              const recordatoriosDelDia = recordatorios.filter(
                (r) => r.fecha === fechaISO && !(r.horaInicio && r.horaFin)
              );
              return (
                <div
                  key={dia}
                  className="flex flex-col items-center gap-1 p-1 text-center"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onSoltarEnFilaRecordatorios(e, fecha)}
                >
                  {recordatoriosDelDia.map((r) => (
                    <TarjetaRecordatorio key={r.id} recordatorio={r} />
                  ))}
                  {recordatoriosDelDia.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
