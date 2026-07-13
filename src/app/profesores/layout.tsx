import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NotebookPen, Link2, Users, StickyNote, CalendarClock } from "lucide-react";
import { DashboardShell } from "@/compartido/ui/dashboard-shell";
import type { SidebarNavItem } from "@/compartido/ui/sidebar-nav";

const iconClass = "size-4 shrink-0";

const navItems: SidebarNavItem[] = [
  { href: "/profesores/dashboard/notas", label: "Mis Notas", icon: <NotebookPen className={iconClass} /> },
  { href: "/profesores/dashboard/asignaciones", label: "Mis Asignaciones", icon: <Link2 className={iconClass} /> },
  { href: "/profesores/dashboard/estudiantes", label: "Mis Estudiantes", icon: <Users className={iconClass} /> },
  { href: "/profesores/dashboard/horarios", label: "Mis Horarios", icon: <CalendarClock className={iconClass} /> },
  { href: "/profesores/dashboard/recordatorios", label: "Mis Recordatorios", icon: <StickyNote className={iconClass} /> },
];

export default async function ProfesoresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || session.user.rol !== "PROFESOR") {
    redirect("/auth/login");
  }

  return (
    <DashboardShell subtitulo="Panel del Profesor" navItems={navItems} usuario={session.user}>
      {children}
    </DashboardShell>
  );
}
