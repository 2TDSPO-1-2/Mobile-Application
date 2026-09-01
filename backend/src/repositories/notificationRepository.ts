import { queryRows, queryOne, executeStatement } from '../utils/oracle';
import type { NotificationDto } from '../types';

type AlertRow = {
  ID_ALERTA: number;
  TP_ALERTA: string;
  DS_MENSAGEM: string;
  ST_STATUS: string;
  TP_CANAL: string;
  ID_ANIMAL: number;
  ID_RESPONSAVEL: number | null;
  ID_CLINICA: number | null;
  DT_ENVIO: Date;
  DT_LEITURA: Date | null;
};

const ALERT_SELECT = `
  SELECT
    al.ID_ALERTA,
    al.TP_ALERTA,
    DBMS_LOB.SUBSTR(al.DS_MENSAGEM, 4000, 1) AS DS_MENSAGEM,
    al.ST_STATUS,
    al.TP_CANAL,
    al.ID_ANIMAL,
    al.ID_RESPONSAVEL,
    al.ID_CLINICA,
    al.DT_ENVIO,
    al.DT_LEITURA
  FROM TB_ARKIVE_ALERTA al
`;

function mapAlert(row: AlertRow): NotificationDto {
  return {
    id: row.ID_ALERTA,
    type: row.TP_ALERTA,
    message: row.DS_MENSAGEM,
    status: row.ST_STATUS as NotificationDto['status'],
    channel: row.TP_CANAL,
    animalId: row.ID_ANIMAL,
    responsavelId: row.ID_RESPONSAVEL,
    clinicaId: row.ID_CLINICA,
    sentAt: row.DT_ENVIO instanceof Date ? row.DT_ENVIO.toISOString() : String(row.DT_ENVIO),
    readAt: row.DT_LEITURA
      ? row.DT_LEITURA instanceof Date
        ? row.DT_LEITURA.toISOString()
        : String(row.DT_LEITURA)
      : null,
  };
}

export async function findNotifications(filters?: {
  responsavelId?: number;
  clinicaId?: number;
}): Promise<NotificationDto[]> {
  let sql = `${ALERT_SELECT} WHERE al.TP_CANAL = 'APP'`;
  const binds: Record<string, number> = {};

  if (filters?.responsavelId) {
    sql += ' AND al.ID_RESPONSAVEL = :responsavelId';
    binds.responsavelId = filters.responsavelId;
  }
  if (filters?.clinicaId) {
    sql += ' AND al.ID_CLINICA = :clinicaId';
    binds.clinicaId = filters.clinicaId;
  }

  sql += ' ORDER BY al.DT_ENVIO DESC';
  const rows = await queryRows<AlertRow>(sql, binds);
  return rows.map(mapAlert);
}

export async function markNotificationRead(id: number): Promise<NotificationDto | null> {
  await executeStatement(
    `UPDATE TB_ARKIVE_ALERTA
     SET ST_STATUS = 'LIDO', DT_LEITURA = SYSDATE
     WHERE ID_ALERTA = :id`,
    { id }
  );
  const row = await queryOne<AlertRow>(`${ALERT_SELECT} WHERE al.ID_ALERTA = :id`, { id });
  return row ? mapAlert(row) : null;
}
