import type { Connection, BindParameters, ExecuteOptions } from 'oracledb';
import { getConnection, oracledb } from '../config/database';
import { mapOracleError } from './errors';

export type Row = Record<string, unknown>;

const defaultOptions: ExecuteOptions = {
  outFormat: oracledb.OUT_FORMAT_OBJECT,
};

export async function withConnection<T>(
  fn: (connection: Connection) => Promise<T>
): Promise<T> {
  const connection = await getConnection();
  try {
    return await fn(connection);
  } catch (error) {
    throw mapOracleError(error);
  } finally {
    try {
      await connection.close();
    } catch {
      /* ignore close errors */
    }
  }
}

export async function queryRows<T extends Row>(
  sql: string,
  binds: BindParameters = {},
  options?: ExecuteOptions
): Promise<T[]> {
  return withConnection(async (connection) => {
    const result = await connection.execute<T>(sql, binds, {
      ...defaultOptions,
      ...options,
    });
    return (result.rows ?? []) as T[];
  });
}

export async function queryOne<T extends Row>(
  sql: string,
  binds: BindParameters = {},
  options?: ExecuteOptions
): Promise<T | null> {
  const rows = await queryRows<T>(sql, binds, options);
  return rows[0] ?? null;
}

export async function executeStatement(
  sql: string,
  binds: BindParameters = {},
  autoCommit = true
): Promise<void> {
  await withConnection(async (connection) => {
    await connection.execute(sql, binds, { autoCommit, ...defaultOptions });
  });
}

export async function executeReturningId(
  sql: string,
  binds: BindParameters,
  idBindName = 'id'
): Promise<number> {
  return withConnection(async (connection) => {
    const result = await connection.execute<{ [key: string]: number }>(
      sql,
      { ...binds, [idBindName]: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } },
      { autoCommit: true, ...defaultOptions }
    );
    const out = result.outBinds?.[idBindName];
    const id = Array.isArray(out) ? out[0] : out;
    if (id == null) {
      throw new Error('ID não retornado após INSERT.');
    }
    return Number(id);
  });
}

export async function runInTransaction<T>(
  fn: (connection: Connection) => Promise<T>
): Promise<T> {
  return withConnection(async (connection) => {
    try {
      const result = await fn(connection);
      await connection.commit();
      return result;
    } catch (error) {
      try {
        await connection.rollback();
      } catch {
        /* ignore */
      }
      throw mapOracleError(error);
    }
  });
}
