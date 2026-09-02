# ARKIVE — Aplicativo Mobile

> **Gestão veterinária otimizada** — aplicativo mobile para acompanhamento de animais, consultas, avaliações de bem-estar animal, feedbacks e notificações integradas ao banco Oracle.

---

## Sobre o Projeto

**ARKIVE** é um aplicativo mobile de gestão veterinária desenvolvido em **React Native com TypeScript e Expo**, voltado para tutores e veterinários.

O sistema tem como objetivo simplificar procedimentos clínico-veterinários, permitindo que tutores acompanhem seus animais e que veterinários registrem informações relevantes sobre consultas, avaliações de bem-estar animal e histórico de atendimento.

O aplicativo se conecta a um backend em **Node.js + Express**, responsável pela comunicação com o banco de dados **Oracle**, onde ficam armazenadas as informações de usuários, animais, consultas, avaliações, feedbacks e notificações.

A proposta do ARKIVE é oferecer uma solução mobile-first para o gerenciamento de informações veterinárias, preservando organização de código, navegação entre telas, persistência local com AsyncStorage e integração com dados reais do banco.

---

## Disciplina

**Mobile Application Development**

Turma: `2TDSPO` · FIAP - Unidade Paulista · 2026

---

## Equipe

| RM | Nome |
|:---|:-----|
| RM561408 | Gustavo Crevelari Monteiro Porto |
| RM561996 | Lucca de Araujo Gomes |
| RM561671 | Rafaela Ferreira Santos |
| RM566224 | Victor Sabelli Rocha Batista |

---

## Links do Projeto

### Repositório

> [GitHub — Mobile Application](https://github.com/2TDSPO-1-2/Mobile-Application)

### Aplicação publicada

> [GitHub Pages — ArkIve Mobile](https://2TDSPO-1-2.github.io/Mobile-Application/)

### API publicada

> [Render — ArkIve API (Spring Boot)](https://arkive-b7v2.onrender.com)

### Vídeo demonstrativo

> [YouTube — Projeto ArkIve (MAD)](https://youtu.be/20kEQ-NOdss)

---

## Tecnologias Utilizadas

### Aplicativo Mobile

- React Native
- TypeScript
- Expo
- React Navigation
- AsyncStorage
- StyleSheet
- Expo Web / React Native Web

### Backend

- Node.js
- Express
- TypeScript
- node-oracledb
- dotenv
- cors

### Banco de Dados

- Oracle Database
- Schema relacional ARKIVE
- Tabelas `TB_ARKIVE_*`
- Procedures `PR_ARKIVE_*`

### Publicação

- GitHub
- GitHub Pages
- Render

---

## Estrutura do Repositório

```txt
Mobile-Application/
├── README.md
│
└── ARKIVE/
    ├── App.tsx
    ├── app.json
    ├── babel.config.js
    ├── index.ts
    ├── package.json
    ├── package-lock.json
    ├── tsconfig.json
    │
    ├── src/
    │   ├── assets/
    │   ├── components/
    │   ├── config/
    │   ├── context/
    │   ├── data/
    │   ├── hooks/
    │   ├── interfaces/
    │   ├── navigation/
    │   ├── screens/
    │   ├── services/
    │   ├── storage/
    │   ├── styles/
    │   ├── types/
    │   └── utils/
    │
    └── backend/
        ├── package.json
        ├── package-lock.json
        ├── tsconfig.json
        ├── README.md
        ├── .env.example
        │
        └── src/
            ├── config/
            ├── controllers/
            ├── middleware/
            ├── repositories/
            ├── routes/
            ├── services/
            ├── types/
            ├── utils/
            └── server.ts
```

---

## Visão Geral da Aplicação

O ARKIVE Mobile possui dois perfis principais de uso:

### Tutor

O tutor é o responsável pelo animal. Ele pode:

- Fazer login com CPF e senha.
- Cadastrar animais.
- Atualizar dados dos animais.
- Solicitar consultas.
- Consultar agenda.
- Visualizar avaliações de bem-estar animal.
- Consultar feedbacks.
- Receber notificações.
- Editar dados básicos do perfil.
- Alternar tema claro/escuro.

### Veterinário

O veterinário é o profissional responsável pelo atendimento clínico. Ele pode:

- Fazer login com CRMV e senha.
- Visualizar pacientes vinculados.
- Consultar agenda de atendimentos.
- Registrar avaliação de bem-estar animal.
- Marcar consultas como realizadas.
- Consultar feedbacks recebidos.
- Receber notificações.
- Editar dados básicos do perfil.

---

## Arquitetura da Solução

```txt
┌────────────────────────────────────────────┐
│ App Mobile — React Native + Expo           │
│                                            │
│ Telas                                      │
│ Componentes reutilizáveis                  │
│ Contextos                                  │
│ Services                                   │
│ AsyncStorage                               │
└───────────────────────┬────────────────────┘
                        │ HTTP / JSON
                        ▼
┌────────────────────────────────────────────┐
│ Backend — Node.js + Express + TypeScript   │
│                                            │
│ Routes                                     │
│ Controllers                                │
│ Services                                   │
│ Repositories                               │
│ node-oracledb                              │
└───────────────────────┬────────────────────┘
                        │ SQL / Procedures
                        ▼
┌────────────────────────────────────────────┐
│ Oracle Database                            │
│                                            │
│ TB_ARKIVE_*                                │
│ PR_ARKIVE_*                                │
└────────────────────────────────────────────┘
```

---

## Persistência de Dados

O projeto utiliza duas camadas de persistência.

### Oracle Database

O Oracle é a fonte principal dos dados de negócio:

- Usuários
- Tutores
- Veterinários
- Animais
- Consultas
- Avaliações de Bem-Estar Animal
- Feedbacks
- Notificações

### AsyncStorage

O AsyncStorage é usado no app para:

- Sessão do usuário
- Início automático
- Tema claro/escuro
- Preferências locais
- Cache/fallback quando a API não estiver disponível

---

## Principais Funcionalidades

### Autenticação

- Login por CPF para tutores.
- Login por CRMV para veterinários.
- Cadastro de tutor.
- Cadastro de veterinário.
- Persistência de sessão.
- Início automático.

### Animais

- Tutor visualiza apenas seus animais.
- Tutor cadastra novo animal.
- Tutor atualiza dados do animal.
- Veterinário visualiza pacientes vinculados às suas consultas.
- Espécie e raça são selecionadas com base em registros existentes.

### Consultas

- Tutor solicita consulta.
- Tutor seleciona animal, veterinário, data e horário.
- Veterinário visualiza consultas atribuídas.
- Consultas são organizadas em:
  - Solicitadas
  - Marcadas
  - Realizadas

### Avaliação de Bem-Estar Animal

- Registrada pelo veterinário.
- Vinculada à consulta.
- Separada do feedback.
- Contém observações clínicas e informações de bem-estar animal.

### Feedbacks

- Feedback é separado da avaliação de bem-estar.
- Nota de 0 a 5.
- Pode ser vinculado à consulta.
- Usuário pode consultar feedbacks recebidos.

### Notificações

- Exibição de notificações relacionadas ao usuário.
- Marcar notificação como lida.
- Marcar todas como lidas.
- Expansão de cards para ações.

### Perfil e Configurações

- Visualização do perfil.
- Edição de nome, e-mail e telefone.
- Logout.
- Preferências de tema.
- Preferências de notificações.
- Informações do app.

### Pesquisa

- Busca global.
- Filtros por tipo.
- Pesquisa por:
  - Animais
  - Veterinários
  - Clínicas

---

## Telas do Aplicativo

| Tela | Descrição |
|:-----|:----------|
| Entrar | Login por CPF ou CRMV |
| Cadastro | Cadastro de tutor ou veterinário |
| Início | Resumo de consultas do dia e acesso rápido |
| Agenda | Consultas solicitadas, marcadas e realizadas |
| Animais/Pacientes | Animais do tutor ou pacientes do veterinário |
| Novo Animal | Cadastro de animal |
| Atualizar Animal | Atualização de dados do animal |
| Acompanhamento | Histórico e detalhes do animal |
| Nova Consulta | Solicitação de consulta |
| Avaliações de BEA | Lista de avaliações de bem-estar animal |
| Avaliação de Bem-Estar Animal | Registro feito pelo veterinário |
| Feedbacks | Lista e envio de feedbacks |
| Pesquisa | Busca global por dados do sistema |
| Perfil | Dados do usuário e ações de conta |
| Configurações | Tema, notificações e informações do app |
| Notificações | Histórico de notificações |

---

## Integração com a API

> O antigo backend Node.js/Express deste repositório (`ARKIVE/backend/`) foi removido. O app
> agora se conecta diretamente à **API Spring Boot** do ArkIve — Oracle, Flyway e Spring
> Security, autenticação HTTP Basic em `/api/**`.

```txt
https://arkive-b7v2.onrender.com
```

Configuração centralizada em:

```txt
src/config/api.ts
```

Por padrão o app usa a URL acima. Para apontar para outro ambiente (por exemplo, um backend
rodando na rede local), defina a variável pública `EXPO_PUBLIC_API_URL` (veja `.env.example`) —
não edite a URL diretamente no código-fonte:

```env
EXPO_PUBLIC_API_URL=http://192.168.15.14:8080
```

A URL da API não é segredo; **credenciais de veterinário nunca vão em variáveis de ambiente** —
são digitadas na tela de login e guardadas com `expo-secure-store` (ver
`src/storage/credentialStore.ts`).

---

## Endpoints Utilizados (histórico — backend Node retirado)

> A tabela abaixo documenta os endpoints do antigo backend Node.js/Express (removido). O app
> agora consome a API Spring Boot (`/api/**`, autenticação HTTP Basic), que ainda está sendo
> integrada — ver `src/services/consultaService.ts` para o primeiro endpoint real conectado
> (`GET /api/consultas`).

| Método | Endpoint | Descrição |
|:------:|:---------|:----------|
| GET | `/` | Verifica se a API está online |
| GET | `/health` | Verifica status da API |
| POST | `/auth/login` | Login |
| POST | `/auth/register` | Cadastro |
| GET | `/users` | Lista usuários |
| GET | `/users/:id` | Busca usuário |
| GET | `/animals` | Lista animais |
| GET | `/animals/:id` | Busca animal |
| POST | `/animals` | Cria animal |
| PUT | `/animals/:id` | Atualiza animal |
| DELETE | `/animals/:id` | Inativa animal |
| GET | `/appointments` | Lista consultas |
| GET | `/appointments/:id` | Busca consulta |
| POST | `/appointments` | Cria consulta |
| PUT | `/appointments/:id/status` | Atualiza status da consulta |
| GET | `/evaluations` | Lista avaliações |
| POST | `/evaluations` | Cria avaliação de bem-estar |
| GET | `/feedbacks` | Lista feedbacks |
| POST | `/feedbacks` | Cria feedback |
| GET | `/notifications` | Lista notificações |
| PUT | `/notifications/:id/read` | Marca notificação como lida |
| GET | `/search` | Pesquisa global |

---

## Pré-requisitos

Para executar o projeto, é necessário ter instalado:

- Node.js
- npm
- Expo
- Navegador web moderno
- Acesso à internet
- Acesso ao banco Oracle FIAP

---

## Como Executar o Backend Localmente (removido)

O backend Node.js/Express que vivia em `ARKIVE/backend/` foi removido deste repositório — não há
mais um servidor local para instalar/rodar aqui. O app se conecta diretamente à API Spring Boot
publicada em produção (veja "Integração com a API" acima); rodar essa API localmente é um assunto
do repositório do backend Spring, não deste.

## API Publicada no Render

```txt
https://arkive-b7v2.onrender.com
```

> Observação: em planos gratuitos, a primeira requisição pode demorar bastante porque o serviço
> pode entrar em modo de inatividade — trate isso como um estado de carregamento normal, nunca
> como credencial inválida (ver `src/context/AuthContext.tsx`, estado `unreachable`).

---

## Configuração Oracle (histórico — backend Node retirado)

> **Aviso de segurança:** uma versão anterior deste README publicou aqui, em texto puro, um
> usuário e senha reais do Oracle FIAP. Esse valor foi removido e a credencial correspondente
> deve ser considerada comprometida e rotacionada. Nunca commitar credenciais reais — apenas
> placeholders, como no exemplo abaixo.

O antigo backend Node.js/Express (pasta `ARKIVE/backend/`) utilizava `node-oracledb` para conexão
direta com o banco Oracle. Essa pasta foi removida do repositório: o aplicativo agora se conecta
à API Spring Boot do ArkIve (veja "Integração com a API" acima). O formato de configuração usado
pelo backend Node, para referência histórica, era:

```env
ORACLE_USER=<usuario>
ORACLE_PASSWORD=<senha>
ORACLE_CONNECT_STRING=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=oracle.fiap.com.br)(PORT=1521))(CONNECT_DATA=(SID=ORCL)))
```

Essa configuração não se aplica mais ao aplicativo mobile.

---

## Como Executar o App Localmente

Acesse a pasta do app:

```bash
cd ARKIVE
```

Instale as dependências:

```bash
npm install
```

Para rodar na web:

```bash
npm run web
```

ou:

```bash
npx expo start --web
```

O app será iniciado em:

```txt
http://localhost:8081
```

Para iniciar pelo Expo:

```bash
npm start
```

---

## Como Acessar o App Publicado

O app está publicado no GitHub Pages:

```txt
https://2TDSPO-1-2.github.io/Mobile-Application/
```

A publicação web foi gerada com:

```bash
cd ARKIVE
npx expo export --platform web
npx gh-pages --nojekyll -d dist
```

---

## Scripts Disponíveis

### App

| Comando | Descrição |
|:--------|:----------|
| `npm start` | Inicia o Expo |
| `npm run web` | Executa o app na web |
| `npm run android` | Executa no Android, se configurado |
| `npm run ios` | Executa no iOS, se configurado |

### Backend

| Comando | Descrição |
|:--------|:----------|
| `npm run dev` | Inicia o backend em desenvolvimento |
| `npm run build` | Compila o backend |
| `npm start` | Executa a versão compilada |
| `npm run typecheck` | Valida TypeScript |

---

## Validação TypeScript

No app:

```bash
cd ARKIVE
npx tsc --noEmit
```

No backend:

```bash
cd ARKIVE/backend
npm run typecheck
```

---

## Credenciais de Teste

### Tutor

```txt
CPF: 12345678901
Senha: hash_senha_001
```

### Veterinário

```txt
CRMV: 12345-SP
Senha: hash_senha_006
```

---

## Fluxo de Demonstração

### Tutor

1. Acessar a tela de login.
2. Entrar com CPF e senha.
3. Visualizar a tela Início.
4. Acessar Animais.
5. Cadastrar ou editar um animal.
6. Solicitar uma consulta.
7. Visualizar a consulta na Agenda.
8. Consultar notificações.
9. Visualizar feedbacks.
10. Acessar Perfil e sair da conta.

### Veterinário

1. Entrar com CRMV e senha.
2. Visualizar pacientes vinculados.
3. Acessar Agenda.
4. Visualizar consultas atribuídas.
5. Registrar Avaliação de Bem-Estar Animal.
6. Marcar consulta como realizada.
7. Visualizar feedbacks recebidos.
8. Consultar notificações.

---

## Roteiro Sugerido para Vídeo

1. Apresentar o objetivo do ARKIVE.
2. Mostrar login como tutor.
3. Mostrar tela Início.
4. Cadastrar um animal.
5. Solicitar consulta.
6. Mostrar a agenda do tutor.
7. Sair e entrar como veterinário.
8. Mostrar pacientes e agenda do veterinário.
9. Registrar Avaliação de Bem-Estar Animal.
10. Marcar consulta como realizada.
11. Mostrar feedbacks e notificações.
12. Mostrar configurações e tema escuro.
13. Encerrar explicando a integração app + backend + Oracle.

---

## Critérios Acadêmicos Atendidos

| Critério | Implementação |
|:---------|:--------------|
| Navegação entre telas | React Navigation com stacks e bottom tabs |
| TypeScript | Tipagem em telas, services, contextos e backend |
| Organização do projeto | Estrutura modular em `src/` |
| Styles separados | Uso de `StyleSheet`, tema e arquivos de estilo |
| AsyncStorage | Sessão, tema, preferências e cache |
| Persistência local | Sessão e fallback local |
| Protótipo funcional | Fluxos principais implementados |
| Execução Expo | Compatível com Expo Web e Expo Go |
| Integração com banco | Backend Express conectado ao Oracle |
| Publicação web | GitHub Pages |
| API pública | Render |

---

## Identidade Visual

O ARKIVE utiliza:

- Tons de verde.
- Logo institucional.
- Ícone próprio.
- Bordas arredondadas.
- Componentes reutilizáveis.
- Tema claro e escuro.
- Layout mobile-first.
- Compatibilidade web via Expo.

---

## Observações Técnicas

- O app é mobile-first, mas pode ser executado na web via Expo.
- O backend é necessário para integração com Oracle.
- O app não acessa o banco diretamente.
- As credenciais Oracle são usadas apenas no backend.
- AsyncStorage é utilizado para sessão, tema e cache.
- O feedback é diferente da Avaliação de Bem-Estar Animal.
- Avaliações de BEA são registradas por veterinários.
- Tutores solicitam consultas e acompanham seus animais.
- A versão publicada no GitHub Pages depende da API publicada no Render para autenticação e dados reais.
- A primeira chamada para a API publicada pode demorar alguns segundos em razão da política de inatividade do plano gratuito do Render.

---

## Status Final

O projeto contempla uma solução funcional para demonstração acadêmica:

- Login e cadastro.
- Perfis de tutor e veterinário.
- Cadastro e atualização de animais.
- Solicitação e acompanhamento de consultas.
- Registro de Avaliação de Bem-Estar Animal.
- Feedbacks.
- Notificações.
- Pesquisa global.
- Perfil.
- Configurações.
- Tema claro/escuro.
- Backend integrado ao Oracle.
- App publicado no GitHub Pages.
- API publicada no Render.

---

*Maio de 2026 · FIAP 2TDSPO*
