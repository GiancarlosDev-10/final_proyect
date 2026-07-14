"use client";

import { useState } from "react";
import { GraduationCap, Menu } from "lucide-react";
import { SidebarNav, type SidebarNavItem } from "@/compartido/ui/sidebar-nav";
import { MobileSidebar } from "@/compartido/ui/mobile-sidebar";
import { BotonCerrarSesion } from "@/compartido/ui/boton-cerrar-sesion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

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

function SidebarBrand({ subtitulo }: { subtitulo: string }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <GraduationCap className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate font-heading text-sm font-semibold leading-tight">Dashboard Colegio</p>
        <p className="truncate text-xs text-sidebar-foreground/60">{subtitulo}</p>
      </div>
    </div>
  );
}

function SidebarFooter({ usuario }: { usuario: Props["usuario"] }) {
  return (
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
      <BotonCerrarSesion />
    </div>
  );
}

export function DashboardShell({ subtitulo, navItems, usuario, children }: Props) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <SidebarBrand subtitulo={subtitulo} />
        <Separator className="bg-sidebar-border" />
        <SidebarNav items={navItems} />
        <Separator className="bg-sidebar-border" />
        <SidebarFooter usuario={usuario} />
      </aside>

      <MobileSidebar open={menuAbierto} onOpenChange={setMenuAbierto}>
        <SidebarBrand subtitulo={subtitulo} />
        <Separator className="bg-sidebar-border" />
        <SidebarNav items={navItems} onNavigate={() => setMenuAbierto(false)} />
        <Separator className="bg-sidebar-border" />
        <SidebarFooter usuario={usuario} />
      </MobileSidebar>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b bg-sidebar px-3 py-3 text-sidebar-foreground md:hidden">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú"
            className="text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
          >
            <Menu className="size-5" />
          </Button>
          <p className="truncate font-heading text-sm font-semibold">{subtitulo}</p>
        </header>
        <main className="flex-1 overflow-auto bg-muted/30">{children}</main>
      </div>
    </div>
  );
}
