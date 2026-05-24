import oracledb from 'oracledb';
import dotenv from 'dotenv';

dotenv.config();

let pool: oracledb.Pool | null = null;

const DEFAULT_ORACLE_CONFIG = {
  user: 'rm561996',
  password: '230602',
  connectString:
    '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=oracle.fiap.com.br)(PORT=1521))(CONNECT_DATA=(SID=ORCL)))',
};

function getEnvOrDefault(name: string, fallback: string): string {
  const value = process.env[name];

  if (value && value.trim().length > 0) {
    return value;
  }

  return fallback;
}

export async function initPool(): Promise<void> {
  if (pool) return;

  pool = await oracledb.createPool({
    user: getEnvOrDefault('ORACLE_USER', DEFAULT_ORACLE_CONFIG.user),
    password: getEnvOrDefault('ORACLE_PASSWORD', DEFAULT_ORACLE_CONFIG.password),
    connectString: getEnvOrDefault(
      'ORACLE_CONNECT_STRING',
      DEFAULT_ORACLE_CONFIG.connectString
    ),
    poolMin: 1,
    poolMax: 10,
    poolIncrement: 1,
  });
}

export async function getConnection(): Promise<oracledb.Connection> {
  if (!pool) {
    await initPool();
  }

  return pool!.getConnection();
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close(0);
    pool = null;
  }
}

export { oracledb };