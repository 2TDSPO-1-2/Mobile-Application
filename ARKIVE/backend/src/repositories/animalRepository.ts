import type { Connection } from 'oracledb';
import { oracledb } from '../config/database';
import { queryRows, queryOne, executeStatement, runInTransaction } from '../utils/oracle';
import type { AnimalDto, CreateAnimalRequest, UpdateAnimalRequest } from '../types';
import { mapNeuteredFromDb, mapNeuteredToDb, mapSexFromDb, mapSexToDb } from '../utils/mappers';

type AnimalRow = {
  ID_ANIMAL: number;
  NM_ANIMAL: string;
  ID_ESPECIE: number;
  NM_ESPECIE: string;
  ID_RACA: number | null;
  NM_RACA: string | null;
  DS_SEXO: string | null;
  DS_CASTRADO: string;
  ST_ATIVO: string;
};

const ANIMAL_SELECT = `
  SELECT
    a.ID_ANIMAL,
    a.NM_ANIMAL,
    a.ID_ESPECIE,
    e.NM_ESPECIE,
    a.ID_RACA,
    r.NM_RACA,
    a.DS_SEXO,
    a.DS_CASTRADO,
    a.ST_ATIVO
  FROM TB_ARKIVE_ANIMAL a
  INNER JOIN TB_ARKIVE_ESPECIE e ON e.ID_ESPECIE = a.ID_ESPECIE
  LEFT JOIN TB_ARKIVE_RACA r ON r.ID_RACA = a.ID_RACA
`;

async function getResponsavelIds(animalId: number): Promise<number[]> {
  const rows = await queryRows<{ ID_RESPONSAVEL: number }>(
    `SELECT ID_RESPONSAVEL FROM TB_ARKIVE_RESPONSAVEL_ANIMAL
     WHERE ID_ANIMAL = :animalId AND ST_ATIVO = 'S'`,
    { animalId }
  );
  return rows.map((r) => r.ID_RESPONSAVEL);
}

async function getResponsavelIdsInTransaction(
  connection: Connection,
  animalId: number
): Promise<number[]> {
  const result = await connection.execute<{ ID_RESPONSAVEL: number }>(
    `SELECT ID_RESPONSAVEL FROM TB_ARKIVE_RESPONSAVEL_ANIMAL
     WHERE ID_ANIMAL = :animalId AND ST_ATIVO = 'S'`,
    { animalId },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  return (result.rows ?? []).map((r) => r.ID_RESPONSAVEL);
}

function mapAnimal(row: AnimalRow, responsavelIds: number[]): AnimalDto {
  return {
    id: row.ID_ANIMAL,
    name: row.NM_ANIMAL,
    speciesId: row.ID_ESPECIE,
    speciesName: row.NM_ESPECIE,
    breedId: row.ID_RACA,
    breedName: row.NM_RACA,
    sex: mapSexFromDb(row.DS_SEXO),
    neutered: mapNeuteredFromDb(row.DS_CASTRADO),
    active: row.ST_ATIVO === 'S',
    responsavelIds,
  };
}

async function findAnimalByIdInTransaction(
  connection: Connection,
  id: number
): Promise<AnimalDto | null> {
  const result = await connection.execute<AnimalRow>(
    `${ANIMAL_SELECT} WHERE a.ID_ANIMAL = :id`,
    { id },
    { outFormat: oracledb.OUT_FORMAT_OBJECT, maxRows: 1 }
  );
  const row = result.rows?.[0];
  if (!row) return null;
  return mapAnimal(row, await getResponsavelIdsInTransaction(connection, id));
}

export async function findAllAnimals(responsavelId?: number): Promise<AnimalDto[]> {
  let sql = `${ANIMAL_SELECT} WHERE a.ST_ATIVO = 'S'`;
  const binds: Record<string, number> = {};

  if (responsavelId) {
    sql += ` AND EXISTS (
      SELECT 1 FROM TB_ARKIVE_RESPONSAVEL_ANIMAL ra
      WHERE ra.ID_ANIMAL = a.ID_ANIMAL
        AND ra.ID_RESPONSAVEL = :responsavelId
        AND ra.ST_ATIVO = 'S'
    )`;
    binds.responsavelId = responsavelId;
  }

  sql += ' ORDER BY a.ID_ANIMAL';
  const rows = await queryRows<AnimalRow>(sql, binds);
  const animals: AnimalDto[] = [];
  for (const row of rows) {
    animals.push(mapAnimal(row, await getResponsavelIds(row.ID_ANIMAL)));
  }
  return animals;
}

export async function findAnimalById(id: number): Promise<AnimalDto | null> {
  const row = await queryOne<AnimalRow>(`${ANIMAL_SELECT} WHERE a.ID_ANIMAL = :id`, { id });
  if (!row) return null;
  return mapAnimal(row, await getResponsavelIds(id));
}

export async function resolveSpeciesId(
  speciesId?: number,
  speciesName?: string
): Promise<number> {
  if (speciesId) {
    const exists = await queryOne<{ ID_ESPECIE: number }>(
      `SELECT ID_ESPECIE FROM TB_ARKIVE_ESPECIE WHERE ID_ESPECIE = :id AND ST_ATIVO = 'S'`,
      { id: speciesId }
    );
    if (exists) return speciesId;
  }
  if (speciesName) {
    const byName = await queryOne<{ ID_ESPECIE: number }>(
      `SELECT ID_ESPECIE FROM TB_ARKIVE_ESPECIE
       WHERE UPPER(NM_ESPECIE) = UPPER(:name) AND ST_ATIVO = 'S'`,
      { name: speciesName.trim() }
    );
    if (byName) return byName.ID_ESPECIE;
  }
  throw new Error('Espécie não encontrada. Informe speciesId ou speciesName válido.');
}

export async function resolveBreedId(
  speciesId: number,
  breedId?: number,
  breedName?: string
): Promise<number | null> {
  if (breedId) return breedId;
  if (!breedName?.trim()) return null;
  const row = await queryOne<{ ID_RACA: number }>(
    `SELECT ID_RACA FROM TB_ARKIVE_RACA
     WHERE ID_ESPECIE = :speciesId AND UPPER(NM_RACA) = UPPER(:name) AND ST_ATIVO = 'S'`,
    { speciesId, name: breedName.trim() }
  );
  return row?.ID_RACA ?? null;
}

export async function createAnimal(data: CreateAnimalRequest): Promise<AnimalDto> {
  const speciesId = await resolveSpeciesId(data.speciesId, data.speciesName);
  const breedId = await resolveBreedId(speciesId, data.breedId, data.breedName);

  return runInTransaction(async (connection: Connection) => {
    await connection.execute(
      `BEGIN PR_ARKIVE_INS_ANIMAL(
        p_nm_animal => :name,
        p_id_especie => :speciesId,
        p_id_raca => :breedId,
        p_ds_sexo => :sex,
        p_ds_castrado => :neutered,
        p_id_clinica => :clinicaId
      ); END;`,
      {
        name: data.name.trim(),
        speciesId,
        breedId,
        sex: mapSexToDb(data.sex),
        neutered: mapNeuteredToDb(data.neutered ?? false),
        clinicaId: data.clinicaId ?? null,
      },
      { autoCommit: false }
    );

    const animalRow = await connection.execute<{ ID_ANIMAL: number }>(
      `SELECT ID_ANIMAL FROM (
         SELECT ID_ANIMAL FROM TB_ARKIVE_ANIMAL
         WHERE NM_ANIMAL = :name AND ID_ESPECIE = :speciesId
         ORDER BY ID_ANIMAL DESC
       ) WHERE ROWNUM = 1`,
      { name: data.name.trim(), speciesId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const animalId = animalRow.rows?.[0]?.ID_ANIMAL;
    if (!animalId) throw new Error('Falha ao recuperar ID do animal.');

    await connection.execute(
      `BEGIN PR_ARKIVE_INS_RESP_ANIMAL(
        p_id_animal => :animalId,
        p_id_responsavel => :respId,
        p_tp_vinculo => 'TUTOR_LEGAL',
        p_st_principal => 'S'
      ); END;`,
      { animalId, respId: data.responsavelId },
      { autoCommit: false }
    );

    const created = await findAnimalByIdInTransaction(connection, animalId);
    if (!created) throw new Error('Animal criado não encontrado.');
    return created;
  });
}

export async function updateAnimal(
  id: number,
  data: UpdateAnimalRequest
): Promise<AnimalDto | null> {
  const current = await findAnimalById(id);
  if (!current) return null;

  await executeStatement(
    `UPDATE TB_ARKIVE_ANIMAL SET
      NM_ANIMAL = :name,
      ID_ESPECIE = :speciesId,
      ID_RACA = :breedId,
      DS_SEXO = :sex,
      DS_CASTRADO = :neutered,
      ST_ATIVO = :active
     WHERE ID_ANIMAL = :id`,
    {
      id,
      name: data.name ?? current.name,
      speciesId: data.speciesId ?? current.speciesId,
      breedId: data.breedId !== undefined ? data.breedId : current.breedId,
      sex: mapSexToDb(data.sex ?? current.sex),
      neutered: mapNeuteredToDb(
        data.neutered !== undefined ? data.neutered : current.neutered
      ),
      active: data.active === false ? 'N' : data.active === true ? 'S' : current.active ? 'S' : 'N',
    }
  );

  return findAnimalById(id);
}

export async function deleteAnimal(id: number): Promise<boolean> {
  const current = await findAnimalById(id);
  if (!current) return false;

  await executeStatement(
    `UPDATE TB_ARKIVE_ANIMAL SET ST_ATIVO = 'N' WHERE ID_ANIMAL = :id`,
    { id }
  );
  await executeStatement(
    `UPDATE TB_ARKIVE_RESPONSAVEL_ANIMAL SET ST_ATIVO = 'N', DT_FIM = SYSDATE
     WHERE ID_ANIMAL = :id AND ST_ATIVO = 'S'`,
    { id }
  );
  return true;
}

export async function findFirstAnimalIdForResponsavel(
  responsavelId: number
): Promise<number | null> {
  const row = await queryOne<{ ID_ANIMAL: number }>(
    `SELECT ID_ANIMAL FROM TB_ARKIVE_RESPONSAVEL_ANIMAL
     WHERE ID_RESPONSAVEL = :responsavelId AND ST_ATIVO = 'S' AND ROWNUM = 1`,
    { responsavelId }
  );
  return row?.ID_ANIMAL ?? null;
}