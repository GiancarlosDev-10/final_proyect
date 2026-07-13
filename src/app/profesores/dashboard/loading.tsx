import { Loader2 } from "lucide-react";

export default function CargandoDashboardProfesor() {
  return (
    <div className="flex h-full min-h-[50vh] items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      Cargando...
    </div>
  );
}
