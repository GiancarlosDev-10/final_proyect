import { env } from "@/config/env";
import { INotificadorAsistenciaApoderado } from "@/modulos/asistencia/aplicacion/i-notificador-asistencia-apoderado";
import { IApoderadoVinculadoRepositorio } from "@/modulos/telegram/aplicacion/i-apoderado-vinculado-repositorio";
import { IEstudianteRepositorio } from "@/modulos/estudiantes/aplicacion/i-estudiante-repositorio";
import { ISesionAsistenciaRepositorio } from "@/modulos/asistencia/aplicacion/i-sesion-asistencia-repositorio";
import { IBloqueHorarioRepositorio } from "@/modulos/horarios/aplicacion/i-bloque-horario-repositorio";
import { IAsignacionRepositorio } from "@/modulos/asignaciones/aplicacion/i-asignacion-repositorio";
import { ICursoRepositorio } from "@/modulos/cursos/aplicacion/i-curso-repositorio";
import { ISeccionRepositorio } from "@/modulos/secciones/aplicacion/i-seccion-repositorio";
import { horaActualHHMM } from "@/modulos/asistencia/dominio/tiempo";

export interface NotificadorAsistenciaApoderadoN8nRepos {
  vinculadoRepo: IApoderadoVinculadoRepositorio;
  estudianteRepo: IEstudianteRepositorio;
  sesionRepo: ISesionAsistenciaRepositorio;
  bloqueRepo: IBloqueHorarioRepositorio;
  asignacionRepo: IAsignacionRepositorio;
  cursoRepo: ICursoRepositorio;
  seccionRepo: ISeccionRepositorio;
}

/**
 * Avisa por el webhook de n8n a cada apoderado vinculado por Telegram cuando
 * su hijo/a queda PRESENTE. Es un efecto secundario best-effort: si no hay
 * webhook configurado, no hay vínculo, o la llamada HTTP falla, no pasa nada
 * — nunca debe interrumpir el marcado de asistencia en sí.
 */
export class NotificadorAsistenciaApoderadoN8n implements INotificadorAsistenciaApoderado {
  constructor(private repos: NotificadorAsistenciaApoderadoN8nRepos) {}

  async notificarPresente(estudianteId: string, sesionId: string): Promise<void> {
    if (!env.N8N_ASISTENCIA_WEBHOOK_URL || !env.N8N_WEBHOOK_SECRET) return;

    try {
      const vinculos = await this.repos.vinculadoRepo.listarPorEstudianteId(estudianteId);
      if (vinculos.length === 0) return;

      const estudiante = await this.repos.estudianteRepo.buscarPorId(estudianteId);
      if (!estudiante) return;

      const sesion = await this.repos.sesionRepo.buscarPorId(sesionId);
      const bloque = sesion ? await this.repos.bloqueRepo.buscarPorId(sesion.bloqueHorarioId) : null;
      const asignacion = bloque ? await this.repos.asignacionRepo.buscarPorId(bloque.asignacionId) : null;
      const [curso, seccion] = await Promise.all([
        asignacion ? this.repos.cursoRepo.buscarPorId(asignacion.cursoId) : null,
        asignacion ? this.repos.seccionRepo.buscarPorId(asignacion.seccionId) : null,
      ]);

      const payload = {
        nombreEstudiante: estudiante.nombreCompleto,
        nombreApoderado: estudiante.apoderado.nombre,
        curso: curso?.nombre ?? "—",
        seccion: seccion ? `${seccion.grado} ${seccion.nombre}` : "—",
        hora: horaActualHHMM(),
      };

      await Promise.allSettled(
        vinculos.map((vinculo) =>
          fetch(env.N8N_ASISTENCIA_WEBHOOK_URL!, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-api-key": env.N8N_WEBHOOK_SECRET! },
            body: JSON.stringify({ chatId: vinculo.chatId, ...payload }),
          })
        )
      );
    } catch (e) {
      console.error("No se pudo notificar la asistencia al apoderado:", e);
    }
  }
}
