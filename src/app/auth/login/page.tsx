import { Bell, BellRing, Bot, Camera, Cloud, ScanFace } from "lucide-react";
import { LoginForm } from "@/modulos/auth/presentacion/login-form";
import { LogoEduConecta } from "@/compartido/ui/logo-educonecta";

const satelites = [
  { Icono: Camera, posicion: "left-4 top-2" },
  { Icono: Bell, posicion: "-right-3 top-14" },
  { Icono: Bot, posicion: "-right-1 bottom-6" },
  { Icono: Cloud, posicion: "bottom-2 left-1" },
];

const funciones = [
  { Icono: ScanFace, texto: "Asistencia con reconocimiento facial" },
  { Icono: BellRing, texto: "Avisos a los padres por Telegram" },
  { Icono: Bot, texto: "Bots con IA para profesores" },
];

function PanelMarca() {
  return (
    <div className="relative hidden w-1/2 items-center justify-center overflow-hidden bg-[#0B1220] px-12 text-[#F4EFE6] md:flex">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(#F4EFE6_1px,transparent_1px)] [background-size:22px_22px]"
      />
      <div className="relative flex max-w-md flex-col items-center text-center">
        <div className="relative size-64 lg:size-72">
          <div className="absolute inset-0 rounded-full border border-[#F2C14E]/40" />
          <LogoEduConecta className="absolute inset-10" />
          {satelites.map(({ Icono, posicion }) => (
            <span
              key={posicion}
              className={`absolute grid size-14 place-items-center rounded-full border-2 border-[#F2C14E] bg-[#14213D] ${posicion}`}
            >
              <Icono className="size-6" />
            </span>
          ))}
        </div>
        <h2 className="mt-10 font-heading text-5xl font-bold tracking-tight">EduConecta</h2>
        <p className="mt-3 text-lg font-semibold text-[#F2C14E]">Llevamos la gestión escolar a la nube</p>
        <ul className="mt-6 space-y-2 text-left text-sm text-[#B8C2D6]">
          {funciones.map(({ Icono, texto }) => (
            <li key={texto} className="flex items-center gap-2.5">
              <Icono className="size-4 shrink-0 text-[#F2C14E]" />
              {texto}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen">
      <PanelMarca />
      <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-muted/40 to-background p-4">
        <LoginForm />
      </div>
    </main>
  );
}
