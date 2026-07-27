/**
 * Efecto secundario, no parte del flujo principal de marcar asistencia: avisa
 * (best-effort) al apoderado vinculado por Telegram cuando su hijo/a queda
 * PRESENTE. Nunca debe lanzar — un fallo acá no puede romper ni revertir el
 * marcado de asistencia en sí.
 */
export interface INotificadorAsistenciaApoderado {
  notificarPresente(estudianteId: string, sesionId: string): Promise<void>;
}
