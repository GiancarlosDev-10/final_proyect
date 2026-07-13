"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Pencil, UserX, UserCheck, Eye } from "lucide-react";
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

interface Props {
  usuarios: UsuarioPublico[];
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Usuarios</h1>
          <p className="text-sm text-muted-foreground">Administra las cuentas de acceso al sistema.</p>
        </div>
        <Button onClick={abrirCrear}>
          <Plus className="size-4" />
          Nuevo usuario
        </Button>
      </div>

      <Card className="p-0">
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
              {usuarios.map((u) => (
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
              {usuarios.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No hay usuarios registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
