import type { Metadata } from "next";
import { Bricolage_Grotesque, IBM_Plex_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ProveedorSesion } from "@/compartido/ui/proveedor-sesion";
import "./globals.css";

const fuenteDisplay = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
});

const fuenteSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Dashboard Colegio",
  description: "Sistema de gestión académica escolar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${fuenteDisplay.variable} ${fuenteSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ProveedorSesion>{children}</ProveedorSesion>
        <Toaster />
      </body>
    </html>
  );
}
