import Link from "next/link";
import { GraduationCap, LogOut } from "lucide-react";
import { SidebarNav, type SidebarNavItem } from "@/compartido/ui/sidebar-nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface Props {
  subtitulo: string;
  navItems: SidebarNavItem[];
  usuario: { nombre?: string | null; email?: string | null };
  children: React.ReactNode;
}

function iniciales(usuario: { nombre?: string | null; email?: string | null }) {
  const base = usuario.nombre ?? usuario.email ?? "?";
  return base
    .trim()
    .split(/\s+/)
    .map((parte) => parte[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function DashboardShell({ subtitulo, navItems, usuario, children }: Props) {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-2.5 px-4 py-5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <GraduationCap className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-heading text-sm font-semibold leading-tight">Dashboard Colegio</p>
            <p className="truncate text-xs text-sidebar-foreground/60">{subtitulo}</p>
          </div>
        </div>
        <Separator className="bg-sidebar-border" />
        <SidebarNav items={navItems} />
        <Separator className="bg-sidebar-border" />
        <div className="flex items-center gap-2.5 p-3">
          <Avatar size="sm">
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
              {iniciales(usuario)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{usuario.nombre}</p>
            <p className="truncate text-xs text-sidebar-foreground/60">{usuario.email}</p>
          </div>
          <Link
            href="/api/auth/signout"
            title="Cerrar sesión"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-destructive"
          >
            <LogOut className="size-4" />
            <span className="sr-only">Cerrar sesión</span>
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-muted/30">{children}</main>
    </div>
  );
}
