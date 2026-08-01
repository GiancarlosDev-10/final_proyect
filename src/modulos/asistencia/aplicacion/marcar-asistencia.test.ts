import { describe, it, expect } from "vitest";
import { marcarAsistencia } from "@/modulos/asistencia/aplicacion/marcar-asistencia";
import { INotificadorAsistenciaApoderado } from "@/modulos/asistencia/aplicacion/i-notificador-asistencia-apoderado";
import { IRegistroAsistenciaRepositorio } from "@/modulos/asistencia/aplicacion/i-registro-asistencia-repositorio";
import { RegistroAsistencia } from "@/modulos/asistencia/dominio/registro-asistencia";
import { ESTADOS_ASISTENCIA } from "@/config/constantes";
import { FakeRegistroAsistenciaRepositorio, crearRegistroAsistencia } from "@/test/fixtures-notas";

/**
 * Simula la condición de carrera: el primer crear() falla con el código de
 * duplicado de Mongo (E11000) como si otra petición concurrente hubiera
 * creado el registro un instante antes — y ese registro "ganador" ya está
 * disponible para buscarPorSesionYEstudiante, tal como pasaría en Mongo real.
 */
class RepoQueChocaAlCrear implements IRegistroAsistenciaRepositorio {
  registros: RegistroAsistencia[] = [];
  private yaChoco = false;

  async buscarPorSesionYEstudiante(sesionId: string, estudianteId: string): Promise<RegistroAsistencia | null> {
    return this.registros.find((r) => r.sesionId === sesionId && r.estudianteId === estudianteId) ?? null;
  }
  async listarPorSesion(sesionId: string): Promise<RegistroAsistencia[]> {
    return this.registros.filter((r) => r.sesionId === sesionId);
  }
  async crear(registro: RegistroAsistencia): Promise<void> {
    if (!this.yaChoco) {
      this.yaChoco = true;
      // El "ganador" de la carrera ya quedó insertado con otro id.
      this.registros.push(
        new RegistroAsistencia({ ...registro.toPlainObject(), id: "REG-GANADOR", estado: ESTADOS_ASISTENCIA.TARDANZA })
      );
      throw { code: 11000, message: "E11000 duplicate key error collection: ..." };
    }
    this.registros.push(registro);
  }
  async actualizar(registro: RegistroAsistencia): Promise<void> {
    this.registros = this.registros.map((r) => (r.id === registro.id ? registro : r));
  }
  async eliminarPorEstudiante(): Promise<void> {}
}

class NotificadorEspia implements INotificadorAsistenciaApoderado {
  llamadas: Array<{ estudianteId: string; sesionId: string }> = [];
  async notificarPresente(estudianteId: string, sesionId: string): Promise<void> {
    this.llamadas.push({ estudianteId, sesionId });
  }
}

class NotificadorQueFalla implements INotificadorAsistenciaApoderado {
  async notificarPresente(): Promise<void> {
    throw new Error("n8n no responde");
  }
}

describe("marcarAsistencia", () => {
  it("crea un registro nuevo con el estado indicado", async () => {
    const repo = new FakeRegistroAsistenciaRepositorio();
    const resultado = await marcarAsistencia("SES-1", "EST-1", ESTADOS_ASISTENCIA.PRESENTE, repo);
    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.value.estado).toBe(ESTADOS_ASISTENCIA.PRESENTE);
  });

  it("rechaza justificar a un alumno que no está ausente", async () => {
    const repo = new FakeRegistroAsistenciaRepositorio([
      crearRegistroAsistencia({ estado: ESTADOS_ASISTENCIA.PRESENTE }),
    ]);
    const resultado = await marcarAsistencia("SES-1", "EST-1", ESTADOS_ASISTENCIA.JUSTIFICADO, repo);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe("JUSTIFICACION_INVALIDA");
  });

  it("notifica al apoderado cuando un alumno pasa a PRESENTE por primera vez", async () => {
    const repo = new FakeRegistroAsistenciaRepositorio();
    const notificador = new NotificadorEspia();

    await marcarAsistencia("SES-1", "EST-1", ESTADOS_ASISTENCIA.PRESENTE, repo, notificador);

    expect(notificador.llamadas).toEqual([{ estudianteId: "EST-1", sesionId: "SES-1" }]);
  });

  it("no notifica de nuevo si el alumno ya estaba PRESENTE (re-guardado)", async () => {
    const repo = new FakeRegistroAsistenciaRepositorio([
      crearRegistroAsistencia({ estado: ESTADOS_ASISTENCIA.PRESENTE }),
    ]);
    const notificador = new NotificadorEspia();

    await marcarAsistencia("SES-1", "EST-1", ESTADOS_ASISTENCIA.PRESENTE, repo, notificador);

    expect(notificador.llamadas).toHaveLength(0);
  });

  it("no notifica cuando el estado no es PRESENTE (ej. TARDANZA)", async () => {
    const repo = new FakeRegistroAsistenciaRepositorio();
    const notificador = new NotificadorEspia();

    await marcarAsistencia("SES-1", "EST-1", ESTADOS_ASISTENCIA.TARDANZA, repo, notificador);

    expect(notificador.llamadas).toHaveLength(0);
  });

  it("un fallo del notificador no rompe el marcado de asistencia", async () => {
    const repo = new FakeRegistroAsistenciaRepositorio();
    const notificador = new NotificadorQueFalla();

    const resultado = await marcarAsistencia("SES-1", "EST-1", ESTADOS_ASISTENCIA.PRESENTE, repo, notificador);

    expect(resultado.ok).toBe(true);
    const registro = await repo.buscarPorSesionYEstudiante("SES-1", "EST-1");
    expect(registro?.estado).toBe(ESTADOS_ASISTENCIA.PRESENTE);
  });

  it("resuelve el choque de creación concurrente como una actualización, en vez de propagar el error crudo de Mongo", async () => {
    const repo = new RepoQueChocaAlCrear();

    const resultado = await marcarAsistencia("SES-1", "EST-1", ESTADOS_ASISTENCIA.PRESENTE, repo);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value.id).toBe("REG-GANADOR");
      expect(resultado.value.estado).toBe(ESTADOS_ASISTENCIA.PRESENTE);
    }
    // Solo debe quedar un registro (el del ganador, actualizado), no dos.
    expect(repo.registros).toHaveLength(1);
  });

  it("funciona sin notificador (parámetro opcional)", async () => {
    const repo = new FakeRegistroAsistenciaRepositorio();
    const resultado = await marcarAsistencia("SES-1", "EST-1", ESTADOS_ASISTENCIA.PRESENTE, repo);
    expect(resultado.ok).toBe(true);
  });
});
