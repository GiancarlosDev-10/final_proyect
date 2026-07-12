import { accionListarUsuarios } from "@/modulos/usuarios/presentacion/acciones";
import { TablaUsuarios } from "@/modulos/usuarios/presentacion/tabla-usuarios";

export default async function UsuariosPage() {
  const usuarios = await accionListarUsuarios();
  return <TablaUsuarios usuarios={usuarios} />;
}