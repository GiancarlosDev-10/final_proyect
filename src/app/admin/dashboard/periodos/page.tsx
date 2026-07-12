import { accionListarPeriodos } from "@/modulos/periodos/presentacion/acciones";
import { TablaPeriodos } from "@/modulos/periodos/presentacion/tabla-periodos";

export default async function PeriodosPage() {
  const periodos = await accionListarPeriodos();
  return <TablaPeriodos periodos={periodos} />;
}