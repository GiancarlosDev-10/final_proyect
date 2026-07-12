import { CircleCheckIcon, TriangleAlertIcon, OctagonXIcon, CircleDashedIcon, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type StatusBadgeVariant = "success" | "warning" | "error" | "neutral"

const config: Record<StatusBadgeVariant, { icon: LucideIcon; classes: string }> = {
  success: { icon: CircleCheckIcon, classes: "bg-success/15 text-success-text" },
  warning: { icon: TriangleAlertIcon, classes: "bg-warning/15 text-warning-text" },
  error: { icon: OctagonXIcon, classes: "bg-destructive/10 text-destructive" },
  neutral: { icon: CircleDashedIcon, classes: "bg-muted text-muted-foreground" },
}

interface StatusBadgeProps {
  variant: StatusBadgeVariant
  children: React.ReactNode
  className?: string
}

/**
 * Badge de estado que nunca depende solo del color (WCAG 1.4.1): siempre
 * combina un ícono de forma distinta por variante con el texto del estado.
 * Los mismos íconos ya se usan en los toasts de sonner.tsx, para mantener
 * el mismo lenguaje de forma en toda la app.
 */
export function StatusBadge({ variant, children, className }: StatusBadgeProps) {
  const { icon: Icon, classes } = config[variant]
  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center gap-1 rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        classes,
        className
      )}
    >
      <Icon className="size-3" />
      {children}
    </span>
  )
}
