import { conectarMongoDB } from "@/compartido/infraestructura/mongodb-client";
import { ILoginIntentoRepositorio } from "@/modulos/auth/aplicacion/i-login-intento-repositorio";
import { LoginIntento } from "@/modulos/auth/dominio/login-intento";
import { LoginIntentoModel } from "@/modulos/auth/infraestructura/login-intento-schema";

export class LoginIntentoRepositorioMongo implements ILoginIntentoRepositorio {
  async buscarPorEmail(email: string): Promise<LoginIntento | null> {
    await conectarMongoDB();
    const doc = await LoginIntentoModel.findById(email).lean();
    if (!doc) return null;
    return new LoginIntento({
      email: doc._id,
      intentosFallidos: doc.intentosFallidos,
      bloqueadoHasta: doc.bloqueadoHasta,
      actualizadoEn: doc.actualizadoEn,
    });
  }

  async guardar(intento: LoginIntento): Promise<void> {
    await conectarMongoDB();
    const camposDefinidos: Record<string, string | number> = {
      intentosFallidos: intento.intentosFallidos,
      actualizadoEn: intento.actualizadoEn,
    };
    if (intento.bloqueadoHasta !== undefined) camposDefinidos.bloqueadoHasta = intento.bloqueadoHasta;

    await LoginIntentoModel.findByIdAndUpdate(
      intento.email,
      {
        $set: camposDefinidos,
        ...(intento.bloqueadoHasta === undefined ? { $unset: { bloqueadoHasta: "" } } : {}),
      },
      { upsert: true }
    );
  }

  async eliminar(email: string): Promise<void> {
    await conectarMongoDB();
    await LoginIntentoModel.findByIdAndDelete(email);
  }
}
