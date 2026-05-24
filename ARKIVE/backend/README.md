# ArkIve Backend (Fase B)

API REST **Node.js + Express + TypeScript + Oracle** (`node-oracledb`), separada do app mobile.

## Pré-requisitos

1. **Oracle Instant Client** instalado (necessário para `oracledb`).
2. DDL e DML oficiais já executados no schema do usuário:
   - `ARKIVE_boot-setup_DDL_v3.sql`
   - `ARKIVE_seed_DML_v3.sql`
3. Variáveis em `backend/.env` (não commitar).

## Configuração

```bash
cd backend
cp .env.example .env
# Edite .env com suas credenciais
npm install
```

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Desenvolvimento com `tsx watch` |
| `npm run build` | Compila para `dist/` |
| `npm start` | Produção (`node dist/server.js`) |
| `npm run typecheck` | `tsc --noEmit` |

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Health check |
| POST | `/auth/login` | Login (CPF ou CRMV) |
| POST | `/auth/register` | Cadastro tutor/veterinário |
| GET | `/users` | Lista usuários |
| GET | `/users/:id` | Usuário por ID |
| GET | `/animals` | Lista animais (`?responsavelId=`) |
| GET | `/animals/:id` | Animal por ID |
| POST | `/animals` | Cria animal + vínculo tutor |
| PUT | `/animals/:id` | Atualiza animal |
| DELETE | `/animals/:id` | Exclusão lógica |
| GET | `/appointments` | Lista consultas |
| GET | `/appointments/:id` | Consulta por ID |
| POST | `/appointments` | Nova consulta (status `AG`) |
| PUT | `/appointments/:id/status` | Atualiza status |
| GET | `/evaluations` | Lista avaliações bem-estar |
| POST | `/evaluations` | Nova avaliação clínica |
| GET | `/feedbacks` | Lista feedbacks NPS |
| POST | `/feedbacks` | Novo feedback |
| GET | `/notifications` | Alertas APP (`?responsavelId=` ou `?clinicaId=`) |
| PUT | `/notifications/:id/read` | Marca alerta como lido |
| GET | `/search?q=&type=` | Busca global |

## Procedures vs SQL direto

| Operação | Abordagem |
|----------|-----------|
| Cadastro tutor/vet/usuário | `PR_ARKIVE_INS_RESPONSAVEL`, `PR_ARKIVE_INS_VETERINARIO`, `PR_ARKIVE_INS_USUARIO` |
| Criar animal + vínculo | `PR_ARKIVE_INS_ANIMAL`, `PR_ARKIVE_INS_RESP_ANIMAL` |
| Criar consulta | `PR_ARKIVE_INS_CONSULTA` |
| Criar avaliação / feedback | `PR_ARKIVE_INS_AVAL_BEM_ESTAR`, `PR_ARKIVE_INS_FEEDBACK_NPS` |
| Leituras (GET) | `SELECT` com joins |
| Atualizar status consulta | `UPDATE TB_ARKIVE_CONSULTA` |
| Atualizar animal / soft delete | `UPDATE` direto |
| Marcar notificação lida | `UPDATE TB_ARKIVE_ALERTA` |

As procedures de INSERT não retornam ID; após a chamada, o backend recupera o registro via `SELECT` (documentado).

## Mapeamentos API ↔ Oracle

**Usuários e autenticação**

- Login inicial (tela): **CPF + senha** (tutor) ou **CRMV + senha** (veterinário).
- Backend localiza primeiro `TB_ARKIVE_RESPONSAVEL` (CPF) ou `TB_ARKIVE_VETERINARIO` (CRMV), depois `TB_ARKIVE_USUARIO`.
- `DS_LOGIN` é credencial interna após autenticação:
  - **Tutor:** CPF (somente dígitos) em `DS_LOGIN`.
  - **Veterinário:** CRMV (ex.: `12345-SP`) em `DS_LOGIN`.
- Senha em `DS_SENHA_HASH`:
  - **Usuários novos:** SHA-256 (`crypto`).
  - **Usuários seed (acadêmico):** comparação direta com o literal do DML (ex.: `hash_senha_001`). Não use `123456` nos seeds.

**Credenciais seed para teste**

| Perfil | CPF / CRMV | Senha (literal no banco) |
|--------|------------|---------------------------|
| Tutor | `12345678901` | `hash_senha_001` |
| Veterinário | `12345-SP` | `hash_senha_006` |

**Consultas — status:**

| API | Banco |
|-----|-------|
| solicitada | AG |
| em_progresso | EP |
| confirmada | AP |
| realizada | FI |
| cancelada | CA |

**Animal:** sexo `M`/`F`/NULL; castrado `S`/`N`; delete lógico `ST_ATIVO = 'N'`.

**Notificações:** `TB_ARKIVE_ALERTA`, canal `APP`, leitura `ST_STATUS = 'LIDO'`.

**Avaliação clínica:** `TB_ARKIVE_AVALIACAO_BEM_ESTAR` (nota/observações em `DS_OBSERVACAO` formatado).

**Feedback:** `TB_ARKIVE_FEEDBACK_NPS` (nota 0–10).

## Limitações (Fase B)

- Sem JWT/sessão HTTP (Fase C).
- App mobile **não** integrado nesta fase.
- `POST /notifications` não exposto (alertas vêm do seed/DML); criação futura via procedure.
- Campos extras do app (peso/idade no animal) não existem em `TB_ARKIVE_ANIMAL` — apenas colunas do DDL.
- `TP_ALERTA` aceita apenas: `VACINA`, `RETORNO`, `MEDICAMENTO`, `CHECK-UP`.

## Endpoints 501

Nenhum endpoint retorna **501** nesta fase; rotas listadas estão implementadas conforme o schema.

## Exemplo login

```bash
curl -X POST http://localhost:3333/auth/login \
  -H "Content-Type: application/json" \
  -d '{"role":"tutor","identifier":"12345678901","password":"senha"}'
```
