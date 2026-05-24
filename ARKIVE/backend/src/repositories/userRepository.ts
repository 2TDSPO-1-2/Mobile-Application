import type { Connection } from 'oracledb';
import { oracledb } from '../config/database';
import { queryRows, queryOne, runInTransaction } from '../utils/oracle';
import type { ApiUser } from '../types';
import { mapUserRoleFromDb } from '../utils/mappers';
import { onlyDigits, normalizeCrmv } from '../utils/authPayload';

type UserRow = {
  ID_USUARIO: number;
  TP_USUARIO: string;
  ID_RESPONSAVEL: number | null;
  ID_VETERINARIO: number | null;
  DS_LOGIN: string;
  DS_SENHA_HASH: string;
  ST_ATIVO: string;
  NM_RESPONSAVEL: string | null;
  NM_VETERINARIO: string | null;
  DS_EMAIL: string | null;
  NR_CONTATO: string | null;
  DC_CPF_RG: string | null;
  DC_CRMV: string | null;
  DS_ESPECIALIDADE: string | null;
};

const USER_SELECT = `
  SELECT
    u.ID_USUARIO,
    u.TP_USUARIO,
    u.ID_RESPONSAVEL,
    u.ID_VETERINARIO,
    u.DS_LOGIN,
    u.DS_SENHA_HASH,
    u.ST_ATIVO,
    r.NM_RESPONSAVEL,
    r.DC_CPF_RG,
    r.NR_CONTATO,
    COALESCE(r.DS_EMAIL, v.DS_EMAIL) AS DS_EMAIL,
    v.NM_VETERINARIO,
    v.DC_CRMV,
    v.DS_ESPECIALIDADE
  FROM TB_ARKIVE_USUARIO u
  LEFT JOIN TB_ARKIVE_RESPONSAVEL r ON r.ID_RESPONSAVEL = u.ID_RESPONSAVEL
  LEFT JOIN TB_ARKIVE_VETERINARIO v ON v.ID_VETERINARIO = u.ID_VETERINARIO
`;

function mapUserRow(row: UserRow): ApiUser {
  const isVet = row.TP_USUARIO === 'VETERINARIO';
  return {
    id: row.ID_USUARIO,
    role: mapUserRoleFromDb(row.TP_USUARIO),
    name: (isVet ? row.NM_VETERINARIO : row.NM_RESPONSAVEL) ?? row.DS_LOGIN,
    email: row.DS_EMAIL ?? null,
    phone: row.NR_CONTATO ?? null,
    login: row.DS_LOGIN,
    responsavelId: row.ID_RESPONSAVEL,
    veterinarioId: row.ID_VETERINARIO,
    crmv: row.DC_CRMV ?? null,
    cpf: row.DC_CPF_RG ?? null,
    specialty: row.DS_ESPECIALIDADE ?? null,
  };
}

async function fetchUserRow(
  connection: Connection,
  sql: string,
  binds: Record<string, string | number>
): Promise<UserRow | null> {
  const result = await connection.execute<UserRow>(sql, binds, {
    outFormat: oracledb.OUT_FORMAT_OBJECT,
    maxRows: 1,
  });
  return result.rows?.[0] ?? null;
}

export async function findAllUsers(): Promise<ApiUser[]> {
  const rows = await queryRows<UserRow>(
    `${USER_SELECT} WHERE u.ST_ATIVO = 'S' ORDER BY u.ID_USUARIO`
  );
  return rows.map(mapUserRow);
}

export async function findUserById(id: number): Promise<ApiUser | null> {
  const row = await queryOne<UserRow>(`${USER_SELECT} WHERE u.ID_USUARIO = :id`, {
    id,
  });
  return row ? mapUserRow(row) : null;
}

/** Busca por DS_LOGIN (sessão interna / fallback técnico). */
export async function findUserByDsLogin(
  login: string
): Promise<(ApiUser & { passwordHash: string }) | null> {
  const row = await queryOne<UserRow>(
    `${USER_SELECT} WHERE UPPER(u.DS_LOGIN) = UPPER(:login) AND u.ST_ATIVO = 'S'`,
    { login }
  );
  if (!row) return null;
  return { ...mapUserRow(row), passwordHash: row.DS_SENHA_HASH };
}

/**
 * Login inicial: localiza por CPF (tutor) ou CRMV (veterinário) e retorna usuário + hash.
 */
export async function findUserForAuth(
  role: 'tutor' | 'veterinario',
  identifier: string
): Promise<(ApiUser & { passwordHash: string }) | null> {
  if (role === 'tutor') {
    const cpf = onlyDigits(identifier);
    if (!cpf) return null;

    const row = await queryOne<UserRow>(
      `${USER_SELECT}
       WHERE u.ST_ATIVO = 'S'
         AND u.TP_USUARIO = 'RESPONSAVEL'
         AND REPLACE(REPLACE(REPLACE(r.DC_CPF_RG, '.', ''), '-', ''), ' ', '') = :cpf`,
      { cpf }
    );
    if (row) return { ...mapUserRow(row), passwordHash: row.DS_SENHA_HASH };
  } else {
    const crmv = normalizeCrmv(identifier);
    const crmvDigits = onlyDigits(crmv);

    const row = await queryOne<UserRow>(
      `${USER_SELECT}
       WHERE u.ST_ATIVO = 'S'
         AND u.TP_USUARIO = 'VETERINARIO'
         AND (
           UPPER(REPLACE(v.DC_CRMV, '-', '')) = UPPER(REPLACE(:crmv, '-', ''))
           OR REPLACE(REPLACE(v.DC_CRMV, '-', ''), ' ', '') = :crmvDigits
         )`,
      { crmv, crmvDigits }
    );
    if (row) return { ...mapUserRow(row), passwordHash: row.DS_SENHA_HASH };
  }

  return findUserByDsLogin(identifier);
}

export async function registerUser(params: {
  role: 'tutor' | 'veterinario';
  name: string;
  email?: string;
  phone?: string;
  passwordHash: string;
  cpf: string;
  crmv?: string;
}): Promise<ApiUser> {
  return runInTransaction(async (connection: Connection) => {
    let responsavelId: number | null = null;
    let veterinarioId: number | null = null;
    /** DS_LOGIN interno: tutor = CPF; veterinário = CRMV (documentado no README). */
    let dsLogin: string;

    if (params.role === 'tutor') {
      const cpf = onlyDigits(params.cpf);
      dsLogin = cpf;

      await connection.execute(
        `BEGIN PR_ARKIVE_INS_RESPONSAVEL(
          p_nm_responsavel => :name,
          p_dc_cpf_rg => :cpf,
          p_ds_email => :email,
          p_nr_contato => :phone,
          p_tp_responsavel => 'TUTOR'
        ); END;`,
        {
          name: params.name,
          cpf,
          email: params.email ?? null,
          phone: params.phone ?? null,
        },
        { autoCommit: false }
      );

      const respResult = await connection.execute<{ ID_RESPONSAVEL: number }>(
        `SELECT ID_RESPONSAVEL FROM TB_ARKIVE_RESPONSAVEL
         WHERE REPLACE(REPLACE(REPLACE(DC_CPF_RG, '.', ''), '-', ''), ' ', '') = :cpf
         ORDER BY ID_RESPONSAVEL DESC`,
        { cpf },
        { outFormat: oracledb.OUT_FORMAT_OBJECT, maxRows: 1 }
      );
      responsavelId = respResult.rows?.[0]?.ID_RESPONSAVEL ?? null;
      if (!responsavelId) {
        throw new Error('Falha ao recuperar ID do responsável após cadastro.');
      }
    } else {
      if (!params.crmv) throw new Error('CRMV obrigatório.');
      const crmv = normalizeCrmv(params.crmv);
      dsLogin = crmv;

      await connection.execute(
        `BEGIN PR_ARKIVE_INS_VETERINARIO(
          p_nm_veterinario => :name,
          p_dc_crmv => :crmv,
          p_ds_email => :email
        ); END;`,
        {
          name: params.name,
          crmv,
          email: params.email ?? null,
        },
        { autoCommit: false }
      );

      const vetResult = await connection.execute<{ ID_VETERINARIO: number }>(
        `SELECT ID_VETERINARIO FROM TB_ARKIVE_VETERINARIO
         WHERE UPPER(REPLACE(DC_CRMV, '-', '')) = UPPER(REPLACE(:crmv, '-', ''))
         ORDER BY ID_VETERINARIO DESC`,
        { crmv },
        { outFormat: oracledb.OUT_FORMAT_OBJECT, maxRows: 1 }
      );
      veterinarioId = vetResult.rows?.[0]?.ID_VETERINARIO ?? null;
      if (!veterinarioId) {
        throw new Error('Falha ao recuperar ID do veterinário após cadastro.');
      }
    }

    await connection.execute(
      `BEGIN PR_ARKIVE_INS_USUARIO(
        p_tp_usuario => :tp,
        p_id_responsavel => :respId,
        p_id_veterinario => :vetId,
        p_ds_login => :login,
        p_ds_senha_hash => :pwd
      ); END;`,
      {
        tp: params.role === 'tutor' ? 'RESPONSAVEL' : 'VETERINARIO',
        respId: responsavelId,
        vetId: veterinarioId,
        login: dsLogin,
        pwd: params.passwordHash,
      },
      { autoCommit: false }
    );

    const createdRow =
      params.role === 'tutor'
        ? await fetchUserRow(
            connection,
            `${USER_SELECT}
             WHERE u.ID_RESPONSAVEL = :respId AND u.TP_USUARIO = 'RESPONSAVEL'
             ORDER BY u.ID_USUARIO DESC`,
            { respId: responsavelId! }
          )
        : await fetchUserRow(
            connection,
            `${USER_SELECT}
             WHERE u.ID_VETERINARIO = :vetId AND u.TP_USUARIO = 'VETERINARIO'
             ORDER BY u.ID_USUARIO DESC`,
            { vetId: veterinarioId! }
          );

    if (!createdRow) {
      throw new Error('Usuário criado mas não localizado na mesma transação.');
    }

    return mapUserRow(createdRow);
  });
}
