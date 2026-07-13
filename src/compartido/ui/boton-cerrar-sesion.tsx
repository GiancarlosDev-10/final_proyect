"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function BotonCerrarSesion() {
  const [abierto, setAbierto] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  async function onConfirmar() {
    setSaliendo(true);
    await signOut({ callbackUrl: "/auth/login" });
  }

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        title="Cerrar sesión"
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-destructive"
      >
        <LogOut className="size-4" />
        <span className="sr-only">Cerrar sesión</span>
      </button>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar sesión</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">¿Estás seguro de que deseas cerrar sesión?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbierto(false)} disabled={saliendo}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={onConfirmar} disabled={saliendo}>
              {saliendo ? "Cerrando..." : "Cerrar sesión"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
