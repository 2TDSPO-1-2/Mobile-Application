import type { Connection } from 'oracledb';
import { oracledb } from '../config/database';
import { queryRows, queryOne, runInTransaction } from '../utils/oracle';
import type { CreateEvaluationRequest, EvaluationDto } from '../types';

type EvaluationRow = {
  ID_AVALIACAO_BEM_ESTAR: number;
  ID_ANIMAL: number;
  NM_ANIMAL: string;
  ID_RESPONSAVEL: number | null;
  ID_VETERINARIO: number | null;
  ID_CONSULTA: number | null;
  DT_AVALIACAO: Date;
  DS_OBSERVACAO: string | null;
};

const EVAL_SELECT = `
  SELECT
    av.ID_AVALIACAO_BEM_ESTAR,
    av.ID_ANIMAL,
    a.NM_ANIMAL,
    av.ID_RESPONSAVEL,
    av.ID_VETERINARIO,
    av.ID_CONSULTA,
    av.DT_AVALIACAO,
    DBMS_LOB.SUBSTR(av.DS_OBSERVACAO, 4000, 1) AS DS_OBSERVACAO
  FROM TB_ARKIVE_AVALIACAO_BEM_ESTAR av
  INNER JOIN TB_ARKIVE_ANIMAL a ON a.ID_ANIMAL = av.ID_ANIMAL
`;

function parseObservation(obs: string | null): {
  score: number | null;
  clinicalNotes: string | null;
  wellbeingNotes: string | null;
} {
  if (!obs) return { score: null, clinicalNotes: null, wellbeingNotes: null };
  const scoreMatch = obs.match(/Nota:\s*(\d+)/i);
  const clinicalMatch = obs.match(/Clínico:\s*([\s\S]*?)(?=Bem-estar:|$)/i);
  const wellbeingMatch = obs.match(/Bem-estar:\s*([\s\S]*)/i);
  return {
    score: scoreMatch ? Number(scoreMatch[1]) : null,
    clinicalNotes: clinicalMatch?.[1]?.trim() ?? obs,
    wellbeingNotes: wellbeingMatch?.[1]?.trim() ?? null,
  };
}

function buildObservation(data: CreateEvaluationRequest): string {
  const parts = [
    data.score != null ? `Nota: ${data.score}` : null,
    `Clínico: ${data.clinicalNotes}`,
    `Bem-estar: ${data.wellbeingNotes}`,
  ].filter(Boolean);
  return parts.join('\n');
}

function mapEvaluation(row: EvaluationRow): EvaluationDto {
  const parsed = parseObservation(row.DS_OBSERVACAO);
  return {
    id: row.ID_AVALIACAO_BEM_ESTAR,
    animalId: row.ID_ANIMAL,
    animalName: row.NM_ANIMAL,
    responsavelId: row.ID_RESPONSAVEL,
    veterinarianId: row.ID_VETERINARIO,
    appointmentId: row.ID_CONSULTA,
    evaluatedAt:
      row.DT_AVALIACAO instanceof Date
        ? row.DT_AVALIACAO.toISOString()
        : String(row.DT_AVALIACAO),
    score: parsed.score,
    clinicalNotes: parsed.clinicalNotes,
    wellbeingNotes: parsed.wellbeingNotes,
  };
}

async function findEvaluationByIdInTransaction(
  connection: Connection,
  id: number
): Promise<EvaluationDto | null> {
  const result = await connection.execute<EvaluationRow>(
    `${EVAL_SELECT} WHERE av.ID_AVALIACAO_BEM_ESTAR = :id`,
    { id },
    { outFormat: oracledb.OUT_FORMAT_OBJECT, maxRows: 1 }
  );
  const row = result.rows?.[0];
  return row ? mapEvaluation(row) : null;
}

export async function findAllEvaluations(filters?: {
  responsavelId?: number;
  veterinarianId?: number;
}): Promise<EvaluationDto[]> {
  let sql = `${EVAL_SELECT} WHERE 1=1`;
  const binds: Record<string, number> = {};

  if (filters?.responsavelId) {
    sql += ' AND av.ID_RESPONSAVEL = :responsavelId';
    binds.responsavelId = filters.responsavelId;
  }
  if (filters?.veterinarianId) {
    sql += ' AND av.ID_VETERINARIO = :veterinarianId';
    binds.veterinarianId = filters.veterinarianId;
  }

  sql += ' ORDER BY av.DT_AVALIACAO DESC';
  const rows = await queryRows<EvaluationRow>(sql, binds);
  return rows.map(mapEvaluation);
}

export async function findEvaluationByAppointment(
  appointmentId: number
): Promise<EvaluationDto | null> {
  const row = await queryOne<EvaluationRow>(
    `${EVAL_SELECT} WHERE av.ID_CONSULTA = :appointmentId`,
    { appointmentId }
  );
  return row ? mapEvaluation(row) : null;
}

export async function createEvaluation(
  data: CreateEvaluationRequest
): Promise<EvaluationDto> {
  if (data.appointmentId) {
    const existing = await findEvaluationByAppointment(data.appointmentId);
    if (existing) {
      throw new Error('Já existe avaliação para esta consulta.');
    }
  }

  const observation = buildObservation(data);

  return runInTransaction(async (connection: Connection) => {
    await connection.execute(
      `BEGIN PR_ARKIVE_INS_AVAL_BEM_ESTAR(
        p_id_animal => :animalId,
        p_id_responsavel => :respId,
        p_id_veterinario => :vetId,
        p_id_consulta => :appointmentId,
        p_nr_idade => :age,
        p_kg_peso => :weight,
        p_ds_observacao => :observation
      ); END;`,
      {
        animalId: data.animalId,
        respId: data.responsavelId ?? null,
        vetId: data.veterinarianId,
        appointmentId: data.appointmentId ?? null,
        age: data.age ?? null,
        weight: data.weightKg ?? null,
        observation,
      },
      { autoCommit: false }
    );

    let sql = `SELECT ID_AVALIACAO_BEM_ESTAR FROM (
      SELECT ID_AVALIACAO_BEM_ESTAR FROM TB_ARKIVE_AVALIACAO_BEM_ESTAR
      WHERE ID_ANIMAL = :animalId`;
    const binds: Record<string, number> = { animalId: data.animalId };
    if (data.appointmentId) {
      sql += ' AND ID_CONSULTA = :appointmentId';
      binds.appointmentId = data.appointmentId;
    }
    sql += ' ORDER BY ID_AVALIACAO_BEM_ESTAR DESC) WHERE ROWNUM = 1';

    const row = await connection.execute<{ ID_AVALIACAO_BEM_ESTAR: number }>(
      sql,
      binds,
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const id = row.rows?.[0]?.ID_AVALIACAO_BEM_ESTAR;
    if (!id) throw new Error('Falha ao recuperar ID da avaliação.');

    const created = await findEvaluationByIdInTransaction(connection, id);
    if (!created) throw new Error('Avaliação criada não encontrada.');
    return created;
  });
}