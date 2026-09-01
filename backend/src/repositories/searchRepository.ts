import { queryRows } from '../utils/oracle';
import type { SearchResult } from '../types';

export async function search(
  term: string,
  type?: string
): Promise<SearchResult[]> {
  const q = `%${term.toUpperCase()}%`;
  const results: SearchResult[] = [];

  if (!type || type === 'responsavel') {
    const rows = await queryRows<{
      ID_RESPONSAVEL: number;
      NM_RESPONSAVEL: string;
    }>(
      `SELECT ID_RESPONSAVEL, NM_RESPONSAVEL
       FROM TB_ARKIVE_RESPONSAVEL
       WHERE ST_ATIVO = 'S'
         AND UPPER(NM_RESPONSAVEL) LIKE :q
       ORDER BY NM_RESPONSAVEL
       FETCH FIRST 20 ROWS ONLY`,
      { q }
    );

    results.push(
      ...rows.map((row) => ({
        type: 'responsavel' as const,
        id: row.ID_RESPONSAVEL,
        title: row.NM_RESPONSAVEL,
        subtitle: 'Tutor ArkIve',
      }))
    );
  }

  if (!type || type === 'veterinario') {
    const rows = await queryRows<{
      ID_VETERINARIO: number;
      NM_VETERINARIO: string;
      DC_CRMV: string;
    }>(
      `SELECT ID_VETERINARIO, NM_VETERINARIO, DC_CRMV
       FROM TB_ARKIVE_VETERINARIO
       WHERE ST_ATIVO = 'S'
         AND (UPPER(NM_VETERINARIO) LIKE :q OR UPPER(DC_CRMV) LIKE :q)
       ORDER BY NM_VETERINARIO
       FETCH FIRST 20 ROWS ONLY`,
      { q }
    );

    results.push(
      ...rows.map((row) => ({
        type: 'veterinario' as const,
        id: row.ID_VETERINARIO,
        title: row.NM_VETERINARIO,
        subtitle: row.DC_CRMV,
      }))
    );
  }

  if (!type || type === 'animal') {
    const rows = await queryRows<{
      ID_ANIMAL: number;
      NM_ANIMAL: string;
      NM_ESPECIE: string;
    }>(
      `SELECT a.ID_ANIMAL, a.NM_ANIMAL, e.NM_ESPECIE
       FROM TB_ARKIVE_ANIMAL a
       INNER JOIN TB_ARKIVE_ESPECIE e ON e.ID_ESPECIE = a.ID_ESPECIE
       WHERE a.ST_ATIVO = 'S'
         AND (UPPER(a.NM_ANIMAL) LIKE :q OR UPPER(e.NM_ESPECIE) LIKE :q)
       ORDER BY a.NM_ANIMAL
       FETCH FIRST 20 ROWS ONLY`,
      { q }
    );

    results.push(
      ...rows.map((row) => ({
        type: 'animal' as const,
        id: row.ID_ANIMAL,
        title: row.NM_ANIMAL,
        subtitle: row.NM_ESPECIE,
      }))
    );
  }

  if (!type || type === 'clinica') {
    const rows = await queryRows<{
      ID_CLINICA: number;
      NM_CLINICA: string;
    }>(
      `SELECT ID_CLINICA, NM_CLINICA
       FROM TB_ARKIVE_CLINICA
       WHERE ST_ATIVO = 'S'
         AND UPPER(NM_CLINICA) LIKE :q
       ORDER BY NM_CLINICA
       FETCH FIRST 20 ROWS ONLY`,
      { q }
    );

    results.push(
      ...rows.map((row) => ({
        type: 'clinica' as const,
        id: row.ID_CLINICA,
        title: row.NM_CLINICA,
        subtitle: 'Clínica veterinária',
      }))
    );
  }

  return results.sort((a, b) => a.title.localeCompare(b.title));
}