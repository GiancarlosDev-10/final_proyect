"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound, MessageCircle, User } from "lucide-react";
import { UsuarioPerfilPropio } from "@/modulos/usuarios/dominio/usuario";
import { validarPassword, PASSWORD_MIN_LENGTH } from "@/modulos/usuarios/dominio/politica-password";
import { validarPinTelegram, PIN_TELEGRAM_LENGTH } from "@/modulos/usuarios/dominio/politica-pin-telegram";
import {
  accionActualizarMiPerfil,
  accionCambiarMiPassword,
  accionConfigurarPinTelegram,
  accionQuitarPinTelegram,
} from "@/modulos/usuarios/presentacion/acciones-perfil";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  perfil: UsuarioPerfilPropio;
}

export function MiPerfil({ perfil }: Props) {
  const router = useRouter();

  const [nombreCompleto, setNombreCompleto] = useState(perfil.nombreCompleto);
  const [notasPersonales, setNotasPersonales] = useState(perfil.notasPersonales ?? "");
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);

  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [confirmarPasswordNueva, setConfirmarPasswordNueva] = useState("");
  const [erroresPassword, setErroresPassword] = useState<string[]>([]);
  const [cambiandoPassword, setCambiandoPassword] = useState(false);

  const [pin, setPin] = useState("");
  const [erroresPin, setErroresPin] = useState<string[]>([]);
  const [guardandoPin, setGuardandoPin] = useState(false);
  const [quitandoPin, setQuitandoPin] = useState(false);

  async function onGuardarPerfil() {
    setGuardandoPerfil(true);
    const resultado = await accionActualizarMiPerfil({
      nombreCompleto,
      notasPersonales: notasPersonales || undefined,
    });
    if (resultado.ok) {
      toast.success(resultado.mensaje);
      router.refresh();
    } else {
      toast.error(resultado.mensaje);
    }
    setGuardandoPerfil(false);
  }

  async function onCambiarPassword() {
    if (passwordNueva !== confirmarPasswordNueva) {
      setErroresPassword(["Las contraseñas nuevas no coinciden."]);
      return;
    }
    const errores = validarPassword(passwordNueva);
    if (errores.length > 0) {
      setErroresPassword(errores);
      return;
    }
    setErroresPassword([]);
    setCambiandoPassword(true);
    const resultado = await accionCambiarMiPassword({ passwordActual, passwordNueva });
    if (resultado.ok) {
      toast.success(resultado.mensaje);
      setPasswordActual("");
      setPasswordNueva("");
      setConfirmarPasswordNueva("");
    } else {
      toast.error(resultado.mensaje);
    }
    setCambiandoPassword(false);
  }

  async function onGuardarPin() {
    const errores = validarPinTelegram(pin);
    if (errores.length > 0) {
      setErroresPin(errores);
      return;
    }
    setErroresPin([]);
    setGuardandoPin(true);
    const resultado = await accionConfigurarPinTelegram(pin);
    if (resultado.ok) {
      toast.success(resultado.mensaje);
      setPin("");
      router.refresh();
    } else {
      toast.error(resultado.mensaje);
    }
    setGuardandoPin(false);
  }

  async function onQuitarPin() {
    setQuitandoPin(true);
    const resultado = await accionQuitarPinTelegram();
    if (resultado.ok) {
      toast.success(resultado.mensaje);
      router.refresh();
    } else {
      toast.error(resultado.mensaje);
    }
    setQuitandoPin(false);
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Mi Perfil</h1>
        <p className="text-sm text-muted-foreground">Administra tu información personal y tu acceso.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <User className="size-4 text-muted-foreground" />
            <CardTitle className="text-base">Información</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              <Input value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={perfil.email} disabled />
              <p className="text-xs text-muted-foreground">Solo el administrador puede cambiar tu email.</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{perfil.rol}</Badge>
              {perfil.activo ? (
                <StatusBadge variant="success">Activo</StatusBadge>
              ) : (
                <StatusBadge variant="neutral">Inactivo</StatusBadge>
              )}
            </div>
            <div className="space-y-2">
              <Label>Notas personales</Label>
              <Textarea
                value={notasPersonales}
                onChange={(e) => setNotasPersonales(e.target.value)}
                rows={4}
                placeholder="Apuntes privados, solo tú los ves."
              />
            </div>
            <Button onClick={onGuardarPerfil} disabled={guardandoPerfil}>
              {guardandoPerfil ? "Guardando..." : "Guardar cambios"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center gap-2 space-y-0">
              <KeyRound className="size-4 text-muted-foreground" />
              <CardTitle className="text-base">Cambiar contraseña</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Contraseña actual</Label>
                <PasswordInput value={passwordActual} onChange={(e) => setPasswordActual(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Nueva contraseña</Label>
                <PasswordInput value={passwordNueva} onChange={(e) => setPasswordNueva(e.target.value)} />
                <p className="text-xs text-muted-foreground">
                  Mínimo {PASSWORD_MIN_LENGTH} caracteres, con mayúscula, minúscula, número y carácter especial.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Confirmar nueva contraseña</Label>
                <PasswordInput value={confirmarPasswordNueva} onChange={(e) => setConfirmarPasswordNueva(e.target.value)} />
              </div>
              {erroresPassword.length > 0 && (
                <ul className="list-disc space-y-0.5 pl-4 text-sm text-destructive">
                  {erroresPassword.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              )}
              <Button
                onClick={onCambiarPassword}
                disabled={cambiandoPassword || !passwordActual || !passwordNueva}
              >
                {cambiandoPassword ? "Cambiando..." : "Cambiar contraseña"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-2 space-y-0">
              <MessageCircle className="size-4 text-muted-foreground" />
              <CardTitle className="text-base">PIN de Telegram</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Estado:</span>
                {perfil.tienePinTelegram ? (
                  <StatusBadge variant="success">Configurado</StatusBadge>
                ) : (
                  <StatusBadge variant="neutral">No configurado</StatusBadge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Úsalo para identificarte en el bot de Telegram de consulta de notas. Es independiente de tu contraseña.
              </p>
              <div className="space-y-2">
                <Label>{perfil.tienePinTelegram ? "Nuevo PIN" : "Crear PIN"} ({PIN_TELEGRAM_LENGTH} dígitos)</Label>
                <Input
                  inputMode="numeric"
                  maxLength={PIN_TELEGRAM_LENGTH}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, PIN_TELEGRAM_LENGTH))}
                  placeholder="••••••"
                />
              </div>
              {erroresPin.length > 0 && (
                <ul className="list-disc space-y-0.5 pl-4 text-sm text-destructive">
                  {erroresPin.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <Button onClick={onGuardarPin} disabled={guardandoPin || pin.length !== PIN_TELEGRAM_LENGTH}>
                  {guardandoPin ? "Guardando..." : perfil.tienePinTelegram ? "Cambiar PIN" : "Guardar PIN"}
                </Button>
                {perfil.tienePinTelegram && (
                  <Button variant="destructive" onClick={onQuitarPin} disabled={quitandoPin}>
                    {quitandoPin ? "Quitando..." : "Quitar PIN"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
