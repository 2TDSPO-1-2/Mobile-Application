import type { Connection } from 'oracledb';
import { oracledb } from '../config/database';
import { queryRows, runInTransaction } from '../utils/oracle';
import type { CreateFeedbackRequest, FeedbackDto } from '../types';

type FeedbackRow = {
  ID_FEEDBACK_NPS: number;
  ID_VETERINARIO: number | null;
  ID_RESPONSAVEL: number | null;
  ID_ANIMAL: number | null;
  ID_CLINICA: number | null;
  ID_CONSULTA: number | null;
  NR_NOTA: number;
  DS_COMENTARIO: string | null;
  DT_FEEDBACK: Date;
};

const FEEDBACK_SELECT = `
  SELECT
    f.ID_FEEDBACK_NPS,
    f.ID_VETERINARIO,
    f.ID_RESPONSAVEL,
    f.ID_ANIMAL,
    f.ID_CLINICA,
    f.ID_CONSULTA,
    f.NR_NOTA,
    DBMS_LOB.SUBSTR(f.DS_COMENTARIO, 4000, 1) AS DS_COMENTARIO,
    f.DT_FEEDBACK
  FROM TB_ARKIVE_FEEDBACK_NPS f
`;

function mapFeedback(row: FeedbackRow): FeedbackDto {
  return {
    id: row.ID_FEEDBACK_NPS,
    veterinarianId: row.ID_VETERINARIO,
    responsavelId: row.ID_RESPONSAVEL,
    animalId: row.ID_ANIMAL,
    clinicaId: row.ID_CLINICA,
    appointmentId: row.ID_CONSULTA,
    rating: row.NR_NOTA,
    comment: row.DS_COMENTARIO,
    createdAt:
      row.DT_FEEDBACK instanceof Date
        ? row.DT_FEEDBACK.toISOString()
        : String(row.DT_FEEDBACK),
  };
}

async function findFeedbackByIdInTransaction(
  connection: Connection,
  id: number
): Promise<FeedbackDto | null> {
  const result = await connection.execute<FeedbackRow>(
    `${FEEDBACK_SELECT} WHERE f.ID_FEEDBACK_NPS = :id`,
    { id },
    { outFormat: oracledb.OUT_FORMAT_OBJECT, maxRows: 1 }
  );
  const row = result.rows?.[0];
  return row ? mapFeedback(row) : null;
}

export async function findAllFeedbacks(): Promise<FeedbackDto[]> {
  const rows = await queryRows<FeedbackRow>(
    `${FEEDBACK_SELECT} ORDER BY f.DT_FEEDBACK DESC`
  );
  return rows.map(mapFeedback);
}

export async function createFeedback(data: CreateFeedbackRequest): Promise<FeedbackDto> {
  if (data.rating < 0 || data.rating > 5) {
    throw new Error('Nota deve estar entre 0 e 5.');
  }

  return runInTransaction(async (connection: Connection) => {
    await connection.execute(
      `BEGIN PR_ARKIVE_INS_FEEDBACK_NPS(
        p_id_veterinario => :vetId,
        p_id_responsavel => :respId,
        p_id_animal => :animalId,
        p_id_clinica => :clinicaId,
        p_id_consulta => :appointmentId,
        p_nr_nota => :rating,
        p_ds_comentario => :comment
      ); END;`,
      {
        vetId: data.veterinarianId ?? null,
        respId: data.responsavelId ?? null,
        animalId: data.animalId ?? null,
        clinicaId: data.clinicaId ?? null,
        appointmentId: data.appointmentId ?? null,
        rating: data.rating,
        comment: data.comment ?? null,
      },
      { autoCommit: false }
    );

    const row = await connection.execute<{ ID_FEEDBACK_NPS: number }>(
      `SELECT ID_FEEDBACK_NPS FROM (
         SELECT ID_FEEDBACK_NPS FROM TB_ARKIVE_FEEDBACK_NPS
         ORDER BY ID_FEEDBACK_NPS DESC
       ) WHERE ROWNUM = 1`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const id = row.rows?.[0]?.ID_FEEDBACK_NPS;
    if (!id) throw new Error('Falha ao recuperar ID do feedback.');

    const created = await findFeedbackByIdInTransaction(connection, id);
    if (!created) throw new Error('Feedback criado não encontrado.');
    return created;
  });
}