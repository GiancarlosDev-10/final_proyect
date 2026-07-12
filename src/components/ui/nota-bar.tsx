import { cn } from "@/lib/utils"

const ESCALA_MAX = 20
const UMBRAL_APROBACION = 11
const SEGMENTOS = 10

export type BandaNota = "error" | "warning" | "success"

export function bandaDeNota(valor: number): BandaNota {
  if (valor < UMBRAL_APROBACION) return "error"
  if (valor < 14) return "warning"
  return "success"
}

const rellenoPorBanda: Record<BandaNota, string> = {
  error: "bg-destructive",
  warning: "bg-warning",
  success: "bg-success",
}

interface NotaBarProps {
  valor: number | null
  size?: "sm" | "lg"
  className?: string
}

/**
 * Barra vigesimal (0-20). El relleno es un solo color según el veredicto
 * final de la nota (Opción B) — nunca mezcla colores por posición, para
 * que una nota aprobatoria no muestre segmentos rojos. La muesca de
 * aprobación (11/20) es fija y siempre visible, sin importar el valor.
 */
export function NotaBar({ valor, size = "sm", className }: NotaBarProps) {
  const alto = size === "lg" ? "h-2.5" : "h-1.5"
  const ancho = size === "lg" ? "w-28" : "w-16"
  const banda = valor == null ? null : bandaDeNota(valor)
  const segmentosLlenos =
    valor == null ? 0 : Math.max(0, Math.min(SEGMENTOS, Math.round((valor / ESCALA_MAX) * SEGMENTOS)))

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div className={cn("relative flex gap-0.5", ancho)}>
        {Array.from({ length: SEGMENTOS }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "flex-1 rounded-full",
              alto,
              i < segmentosLlenos && banda ? rellenoPorBanda[banda] : "bg-muted"
            )}
          />
        ))}
        <span
          className="pointer-events-none absolute inset-y-0 w-px bg-foreground/40"
          style={{ left: `${(UMBRAL_APROBACION / ESCALA_MAX) * 100}%` }}
          aria-hidden
        />
      </div>
      <span className="text-xs font-medium tabular-nums text-muted-foreground">
        {valor == null ? "—" : valor}
      </span>
    </div>
  )
}
