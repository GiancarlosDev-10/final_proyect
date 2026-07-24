"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Pencil, UserX, UserCheck, Eye, MoreVertical, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { UsuarioPublico } from "@/modulos/usuarios/dominio/usuario";
import { validarPassword, PASSWORD_MIN_LENGTH } from "@/modulos/usuarios/dominio/politica-password";
import { accionCrearUsuario, accionActualizarUsuario, accionDesactivarUsuario, accionActivarUsuario } from "@/modulos/usuarios/presentacion/acciones";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  usuarios: UsuarioPublico[];
}

const TAMANO_PAGINA = 10;

function TarjetaUsuario({
  usuario,
  onEditar,
  onDesactivar,
  onActivar,
}: {
  usuario: UsuarioPublico;
  onEditar: (usuario: UsuarioPublico) => void;
  onDesactivar: (id: string) => void;
  onActivar: (id: string) => void;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{usuario.nombreCompleto}</p>
          <p className="truncate text-sm text-muted-foreground">{usuario.email}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Acciones" />}>
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {usuario.rol === "PROFESOR" && (
              <DropdownMenuItem render={<Link href={`/admin/dashboard/usuarios/${usuario.id}`} />}>
                <Eye className="size-4" />
                Ver detalles
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onEditar(usuario)}>
              <Pencil className="size-4" />
              Editar
            </DropdownMenuItem>
            {usuario.activo ? (
              <DropdownMenuItem variant="destructive" onClick={() => onDesactivar(usuario.id)}>
                <UserX className="size-4" />
                Desactivar
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onActivar(usuario.id)}>
                <UserCheck className="size-4" />
                Activar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Badge variant="outline">{usuario.rol}</Badge>
        {usuario.activo ? (
          <Badge className="border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Activo</Badge>
        ) : (
          <Badge variant="secondary">Inactivo</Badge>
        )}
      </div>
    </Card>
  );
}

export function TablaUsuarios({ usuarios }: Props) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState<UsuarioPublico | null>(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmarPassword: "",
    nombreCompleto: "",
    rol: "PROFESOR" as "ADMIN" | "PROFESOR",
  });
  const [erroresPassword, setErroresPassword] = useState<string[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);

  const usuariosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return usuarios;
    return usuarios.filter(
      (u) => u.nombreCompleto.toLowerCase().includes(termino) || u.email.toLowerCase().includes(termino)
    );
  }, [usuarios, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(usuariosFiltrados.length / TAMANO_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const usuariosPagina = useMemo(
    () => usuariosFiltrados.slice((paginaActual - 1) * TAMANO_PAGINA, paginaActual * TAMANO_PAGINA),
    [usuariosFiltrados, paginaActual]
  );

  function onCambiarBusqueda(valor: string) {
    setBusqueda(valor);
    setPagina(1);
  }

  function abrirCrear() {
    setEditando(null);
    setForm({ email: "", password: "", confirmarPassword: "", nombreCompleto: "", rol: "PROFESOR" });
    setErroresPassword([]);
    setAbierto(true);
  }

  function abrirEditar(usuario: UsuarioPublico) {
    setEditando(usuario);
    setForm({ email: usuario.email, password: "", confirmarPassword: "", nombreCompleto: usuario.nombreCompleto, rol: usuario.rol });
    setErroresPassword([]);
    setAbierto(true);
  }

  async function onSubmit() {
    if (!editando) {
      const errores = validarPassword(form.password);
      if (form.password !== form.confirmarPassword) {
        errores.push("Las contraseñas no coinciden.");
      }
      if (errores.length > 0) {
        setErroresPassword(errores);
        return;
      }
    }
    setErroresPassword([]);
    setLoading(true);
    let resultado;

    if (editando) {
      resultado = await accionActualizarUsuario({
        id: editando.id,
        email: form.email,
        nombreCompleto: form.nombreCompleto,
        rol: form.rol,
        activo: editando.activo,
      });
    } else {
      resultado = await accionCrearUsuario({
        email: form.email,
        password: form.password,
        nombreCompleto: form.nombreCompleto,
        rol: form.rol,
      });
    }

    if (resultado.ok) {
      toast.success(resultado.mensaje);
      setAbierto(false);
      router.refresh();
    } else {
      toast.error(resultado.mensaje);
    }
    setLoading(false);
  }

  async function onDesactivar(id: string) {
    const resultado = await accionDesactivarUsuario(id);
    if (resultado.ok) {
      toast.success(resultado.mensaje);
      router.refresh();
    } else {
      toast.error(resultado.mensaje);
    }
  }

  async function onActivar(id: string) {
    const resultado = await accionActivarUsuario(id);
    if (resultado.ok) {
      toast.success(resultado.mensaje);
      router.refresh();
    } else {
      toast.error(resultado.mensaje);
    }
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Usuarios</h1>
        <p className="text-sm text-muted-foreground">Administra las cuentas de acceso al sistema.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(e) => onCambiarBusqueda(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="pl-8"
          />
        </div>
        <Button onClick={abrirCrear}>
          <Plus className="size-4" />
          Nuevo usuario
        </Button>
      </div>

      <div className="space-y-3 md:hidden">
        {usuariosPagina.map((u) => (
          <TarjetaUsuario
            key={u.id}
            usuario={u}
            onEditar={abrirEditar}
            onDesactivar={onDesactivar}
            onActivar={onActivar}
          />
        ))}
        {usuariosFiltrados.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {usuarios.length === 0 ? "No hay usuarios registrados." : "Ningún usuario coincide con la búsqueda."}
          </p>
        )}
      </div>

      <Card className="hidden p-0 md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuariosPagina.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nombreCompleto}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{u.rol}</Badge>
                  </TableCell>
                  <TableCell>
                    {u.activo ? (
                      <Badge className="border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Activo</Badge>
                    ) : (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {u.rol === "PROFESOR" && (
                        <Link
                          href={`/admin/dashboard/usuarios/${u.id}`}
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                          <Eye className="size-3.5" />
                          Ver detalles
                        </Link>
                      )}
                      <Button variant="outline" size="sm" onClick={() => abrirEditar(u)}>
                        <Pencil className="size-3.5" />
                        Editar
                      </Button>
                      {u.activo ? (
                        <Button variant="destructive" size="sm" onClick={() => onDesactivar(u.id)}>
                          <UserX className="size-3.5" />
                          Desactivar
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => onActivar(u.id)}>
                          <UserCheck className="size-3.5" />
                          Activar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {usuariosFiltrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    {usuarios.length === 0 ? "No hay usuarios registrados." : "Ningún usuario coincide con la búsqueda."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {usuariosFiltrados.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Mostrando {(paginaActual - 1) * TAMANO_PAGINA + 1}–
            {Math.min(paginaActual * TAMANO_PAGINA, usuariosFiltrados.length)} de {usuariosFiltrados.length} usuarios
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagina((p) => p - 1)}
              disabled={paginaActual <= 1}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm font-medium">
              Página {paginaActual} de {totalPaginas}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagina((p) => p + 1)}
              disabled={paginaActual >= totalPaginas}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              <Input
                value={form.nombreCompleto}
                onChange={(e) => setForm({ ...form, nombreCompleto: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            {!editando && (
              <>
                <div className="space-y-2">
                  <Label>Contraseña</Label>
                  <PasswordInput
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Mínimo {PASSWORD_MIN_LENGTH} caracteres, con mayúscula, minúscula, número y carácter especial.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Confirmar contraseña</Label>
                  <PasswordInput
                    value={form.confirmarPassword}
                    onChange={(e) => setForm({ ...form, confirmarPassword: e.target.value })}
                  />
                </div>
                {erroresPassword.length > 0 && (
                  <ul className="list-disc space-y-0.5 pl-4 text-sm text-destructive">
                    {erroresPassword.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                )}
              </>
            )}
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select
                value={form.rol}
                onValueChange={(v) => setForm({ ...form, rol: v as "ADMIN" | "PROFESOR" })}
                itemToStringLabel={(rol) => (rol === "ADMIN" ? "Admin" : "Profesor")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="PROFESOR">Profesor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={onSubmit} disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
