import type { Connection } from 'oracledb';
import { oracledb } from '../config/database';
import { queryRows, queryOne, executeStatement, runInTransaction } from '../utils/oracle';
import type {
  AppointmentDto,
  CreateAppointmentRequest,
  ApiAppointmentStatus,
} from '../types';
import { mapStatusFromDb, mapStatusToDb } from '../utils/mappers';

type AppointmentRow = {
  ID_CONSULTA: number;
  DT_HORA: Date;
  TP_MODALIDADE: string;
  DS_MOTIVO: string;
  DS_OBSERVACAO: string | null;
  ST_STATUS: string;
  ID_ANIMAL: number;
  NM_ANIMAL: string;
  ID_VETERINARIO: number;
  NM_VETERINARIO: string;
  ID_CLINICA: number | null;
};

const APPOINTMENT_SELECT = `
  SELECT
    c.ID_CONSULTA,
    c.DT_HORA,
    c.TP_MODALIDADE,
    DBMS_LOB.SUBSTR(c.DS_MOTIVO, 4000, 1) AS DS_MOTIVO,
    DBMS_LOB.SUBSTR(c.DS_OBSERVACAO, 4000, 1) AS DS_OBSERVACAO,
    c.ST_STATUS,
    c.ID_ANIMAL,
    a.NM_ANIMAL,
    c.ID_VETERINARIO,
    v.NM_VETERINARIO,
    c.ID_CLINICA
  FROM TB_ARKIVE_CONSULTA c
  INNER JOIN TB_ARKIVE_ANIMAL a ON a.ID_ANIMAL = c.ID_ANIMAL
  INNER JOIN TB_ARKIVE_VETERINARIO v ON v.ID_VETERINARIO = c.ID_VETERINARIO
`;

function mapAppointment(row: AppointmentRow): AppointmentDto {
  return {
    id: row.ID_CONSULTA,
    animalId: row.ID_ANIMAL,
    animalName: row.NM_ANIMAL,
    veterinarianId: row.ID_VETERINARIO,
    veterinarianName: row.NM_VETERINARIO,
    clinicaId: row.ID_CLINICA,
    dateTime: row.DT_HORA instanceof Date ? row.DT_HORA.toISOString() : String(row.DT_HORA),
    modality: row.TP_MODALIDADE as 'PRESENCIAL' | 'REMOTA',
    status: mapStatusFromDb(row.ST_STATUS),
    reason: row.DS_MOTIVO,
    notes: row.DS_OBSERVACAO,
  };
}

async function findAppointmentByIdInTransaction(
  connection: Connection,
  id: number
): Promise<AppointmentDto | null> {
  const result = await connection.execute<AppointmentRow>(
    `${APPOINTMENT_SELECT} WHERE c.ID_CONSULTA = :id`,
    { id },
    { outFormat: oracledb.OUT_FORMAT_OBJECT, maxRows: 1 }
  );
  const row = result.rows?.[0];
  return row ? mapAppointment(row) : null;
}

export async function findAllAppointments(filters?: {
  responsavelId?: number;
  veterinarianId?: number;
}): Promise<AppointmentDto[]> {
  let sql = APPOINTMENT_SELECT + ' WHERE 1=1';
  const binds: Record<string, number> = {};

  if (filters?.responsavelId) {
    sql += ` AND EXISTS (
      SELECT 1 FROM TB_ARKIVE_RESPONSAVEL_ANIMAL ra
      WHERE ra.ID_ANIMAL = c.ID_ANIMAL
        AND ra.ID_RESPONSAVEL = :responsavelId
        AND ra.ST_ATIVO = 'S'
    )`;
    binds.responsavelId = filters.responsavelId;
  }
  if (filters?.veterinarianId) {
    sql += ' AND c.ID_VETERINARIO = :veterinarianId';
    binds.veterinarianId = filters.veterinarianId;
  }

  sql += ' ORDER BY c.DT_HORA DESC';
  const rows = await queryRows<AppointmentRow>(sql, binds);
  return rows.map(mapAppointment);
}

export async function findAppointmentById(id: number): Promise<AppointmentDto | null> {
  const row = await queryOne<AppointmentRow>(
    `${APPOINTMENT_SELECT} WHERE c.ID_CONSULTA = :id`,
    { id }
  );
  return row ? mapAppointment(row) : null;
}

export async function findVeterinarians(): Promise<Array<{ id: number; name: string; crmv: string | null }>> {
  return queryRows<{ id: number; name: string; crmv: string | null }>(
    `SELECT
       ID_VETERINARIO AS "id",
       NM_VETERINARIO AS "name",
       DC_CRMV AS "crmv"
     FROM TB_ARKIVE_VETERINARIO
     WHERE ST_ATIVO = 'S'
     ORDER BY NM_VETERINARIO`
  );
}

export async function resolveDefaultVeterinarianId(): Promise<number> {
  const row = await queryOne<{ ID_VETERINARIO: number }>(
    `SELECT ID_VETERINARIO FROM TB_ARKIVE_VETERINARIO
     WHERE ST_ATIVO = 'S' ORDER BY ID_VETERINARIO FETCH FIRST 1 ROW ONLY`
  );
  if (!row) throw new Error('Nenhum veterinário ativo encontrado.');
  return row.ID_VETERINARIO;
}

export async function createAppointment(
  data: CreateAppointmentRequest
): Promise<AppointmentDto> {
  const veterinarianId = data.veterinarianId ?? (await resolveDefaultVeterinarianId());
  const dtHora = new Date(data.dateTime);
  const modality = data.modality ?? 'PRESENCIAL';

  if (Number.isNaN(dtHora.getTime())) {
    throw new Error('Data/hora da consulta inválida.');
  }

  return runInTransaction(async (connection: Connection) => {
    await connection.execute(
      `BEGIN PR_ARKIVE_INS_CONSULTA(
        p_dt_hora => :dtHora,
        p_tp_modalidade => :modality,
        p_ds_motivo => :reason,
        p_ds_sintomas => :symptoms,
        p_ds_observacao => :notes,
        p_kg_peso => :weight,
        p_st_status => 'AG',
        p_id_animal => :animalId,
        p_id_veterinario => :vetId,
        p_id_clinica => :clinicaId
      ); END;`,
      {
        dtHora,
        modality,
        reason: data.reason,
        symptoms: data.symptoms ?? null,
        notes: data.notes ?? null,
        weight: data.weightKg ?? null,
        animalId: data.animalId,
        vetId: veterinarianId,
        clinicaId: data.clinicaId ?? null,
      },
      { autoCommit: false }
    );

    const row = await connection.execute<{ ID_CONSULTA: number }>(
      `SELECT ID_CONSULTA FROM (
         SELECT ID_CONSULTA FROM TB_ARKIVE_CONSULTA
         WHERE ID_ANIMAL = :animalId AND ID_VETERINARIO = :vetId
         ORDER BY ID_CONSULTA DESC
       ) WHERE ROWNUM = 1`,
      { animalId: data.animalId, vetId: veterinarianId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const id = row.rows?.[0]?.ID_CONSULTA;
    if (!id) throw new Error('Falha ao recuperar ID da consulta.');

    const created = await findAppointmentByIdInTransaction(connection, id);
    if (!created) throw new Error('Consulta criada não encontrada.');
    return created;
  });
}

export async function updateAppointmentStatus(
  id: number,
  status: ApiAppointmentStatus,
  veterinarianId?: number
): Promise<AppointmentDto | null> {
  const dbStatus = mapStatusToDb(status);
  const binds: Record<string, string | number> = {
    id,
    status: dbStatus,
  };

  let sql = `UPDATE TB_ARKIVE_CONSULTA SET ST_STATUS = :status`;
  if (veterinarianId) {
    sql += ', ID_VETERINARIO = :vetId';
    binds.vetId = veterinarianId;
  }
  sql += ' WHERE ID_CONSULTA = :id';

  await executeStatement(sql, binds);
  return findAppointmentById(id);
}