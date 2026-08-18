"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// El <input type="time"> nativo cambia entre 12h (AM/PM) y 24h según el
// IDIOMA configurado en el navegador (Chrome → Idiomas), no según el reloj
// del sistema operativo — por eso un usuario con Windows en 24h puede seguir
// viendo el selector en 12h. Eso hace que escribir una hora de la tarde/noche
// en formato 24h (ej. "23:37") termine guardándose mal (ej. "11:37") sin
// ningún aviso. Este input es de texto plano, siempre en HH:MM 24h, para que
// el resultado no dependa de la configuración de cada navegador.
function Hora24Input({
  value,
  onChange,
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type" | "value" | "onChange"> & {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  function normalizar(bruto: string): string {
    let digitos = bruto.replace(/\D/g, "").slice(0, 4)
    if (digitos.length >= 2) {
      let horas = digitos.slice(0, 2)
      if (Number(horas) > 23) horas = "23"
      digitos = horas + digitos.slice(2)
    }
    if (digitos.length <= 2) return digitos
    const horas = digitos.slice(0, 2)
    let minutos = digitos.slice(2)
    if (minutos.length === 2 && Number(minutos) > 59) minutos = "59"
    return `${horas}:${minutos}`
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Se reescribe el valor sobre el mismo evento (mismo target real del
    // DOM) para que el resto del código, que lee e.target.value, no tenga
    // que cambiar nada al reemplazar el <input type="time"> por este.
    e.target.value = normalizar(e.target.value)
    onChange(e)
  }

  return (
    <Input
      type="text"
      inputMode="numeric"
      placeholder="HH:MM"
      maxLength={5}
      value={value}
      onChange={onInputChange}
      className={cn("tabular-nums", className)}
      {...props}
    />
  )
}

export { Hora24Input }
