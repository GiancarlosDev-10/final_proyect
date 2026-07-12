import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Users, GraduationCap, BookOpen, CalendarRange, LayoutGrid, ClipboardList, Link2, NotebookPen, Layers } from "lucide-react";
import { DashboardShell } from "@/compartido/ui/dashboard-shell";
import type { SidebarNavItem } from "@/compartido/ui/sidebar-nav";

const iconClass = "size-4 shrink-0";

const navItems: SidebarNavItem[] = [
  { href: "/admin/dashboard/usuarios", label: "Usuarios", icon: <Users className={iconClass} /> },
  { href: "/admin/dashboard/estudiantes", label: "Estudiantes", icon: <GraduationCap className={iconClass} /> },
  { href: "/admin/dashboard/areas", label: "Áreas", icon: <Layers className={iconClass} /> },
  { href: "/admin/dashboard/cursos", label: "Cursos", icon: <BookOpen className={iconClass} /> },
  { href: "/admin/dashboard/periodos", label: "Periodos", icon: <CalendarRange className={iconClass} /> },
  { href: "/admin/dashboard/secciones", label: "Secciones", icon: <LayoutGrid className={iconClass} /> },
  { href: "/admin/dashboard/matriculas", label: "Matrículas", icon: <ClipboardList className={iconClass} /> },
  { href: "/admin/dashboard/asignaciones", label: "Asignaciones", icon: <Link2 className={iconClass} /> },
  { href: "/admin/dashboard/notas", label: "Notas", icon: <NotebookPen className={iconClass} /> },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || session.user.rol !== "ADMIN") {
    redirect("/auth/login");
  }

  return (
    <DashboardShell subtitulo="Panel Administrativo" navItems={navItems} usuario={session.user}>
      {children}
    </DashboardShell>
  );
}
