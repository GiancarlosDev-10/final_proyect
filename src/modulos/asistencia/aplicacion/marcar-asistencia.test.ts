import { describe, it, expect } from "vitest";
import { marcarAsistencia } from "@/modulos/asistencia/aplicacion/marcar-asistencia";
import { INotificadorAsistenciaApoderado } from "@/modulos/asistencia/aplicacion/i-notificador-asistencia-apoderado";
import { ESTADOS_ASISTENCIA } from "@/config/constantes";
import { FakeRegistroAsistenciaRepositorio, crearRegistroAsistencia } from "@/test/fixtures-notas";

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

  it("funciona sin notificador (parámetro opcional)", async () => {
    const repo = new FakeRegistroAsistenciaRepositorio();
    const resultado = await marcarAsistencia("SES-1", "EST-1", ESTADOS_ASISTENCIA.PRESENTE, repo);
    expect(resultado.ok).toBe(true);
  });
});
