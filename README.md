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

## Link para o vídeo demonstrativo

[Inserir título do vídeo no YouTube](https://www.youtube.com/watch?v=...)

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

---

## Estrutura do Repositório

```txt
ARKIVE-MOBILE/
├── App.tsx
├── app.json
├── babel.config.js
├── index.ts
├── package.json
├── tsconfig.json
├── README.md
│
├── src/
│   ├── assets/
│   │   ├── arkive_logo.png
│   │   └── arkive_icon.png
│   │
│   ├── components/
│   │   ├── AppButton.tsx
│   │   ├── AppCard.tsx
│   │   ├── AppHeader.tsx
│   │   ├── AppInput.tsx
│   │   ├── EmptyState.tsx
│   │   ├── HomeHeader.tsx
│   │   ├── RatingInput.tsx
│   │   ├── ScreenContainer.tsx
│   │   ├── SearchBar.tsx
│   │   └── StatusBadge.tsx
│   │
│   ├── config/
│   │   └── api.ts
│   │
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   │
│   ├── data/
│   │   ├── devSeed.ts
│   │   └── seed.ts
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useThemeColors.ts
│   │
│   ├── interfaces/
│   │   └── navigation.ts
│   │
│   ├── navigation/
│   │   ├── AppStack.tsx
│   │   ├── AuthStack.tsx
│   │   ├── BottomTabs.tsx
│   │   └── RootNavigator.tsx
│   │
│   ├── screens/
│   │   ├── AgendaScreen.tsx
│   │   ├── AnimalFollowUpScreen.tsx
│   │   ├── AnimalsScreen.tsx
│   │   ├── EditAnimalScreen.tsx
│   │   ├── EvaluationsScreen.tsx
│   │   ├── FeedbackScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── NewAnimalScreen.tsx
│   │   ├── NewAppointmentScreen.tsx
│   │   ├── NewEvaluationScreen.tsx
│   │   ├── NotificationsScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   └── SettingsScreen.tsx
│   │
│   ├── services/
│   │   ├── animalService.ts
│   │   ├── apiClient.ts
│   │   ├── apiMappers.ts
│   │   ├── appointmentService.ts
│   │   ├── authService.ts
│   │   ├── evaluationService.ts
│   │   ├── feedbackService.ts
│   │   ├── initService.ts
│   │   ├── notificationService.ts
│   │   ├── searchService.ts
│   │   ├── sessionService.ts
│   │   ├── themeService.ts
│   │   └── userService.ts
│   │
│   ├── storage/
│   │   ├── base.ts
│   │   └── keys.ts
│   │
│   ├── styles/
│   │   ├── colors.ts
│   │   ├── common.ts
│   │   └── theme.ts
│   │
│   ├── types/
│   │   └── index.ts
│   │
│   └── utils/
│       ├── age.ts
│       ├── date.ts
│       ├── id.ts
│       └── validation.ts
│
└── backend/
    ├── package.json
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

## Integração com o Backend

O app consome a API local:

```txt
http://localhost:3333
```

Arquivo de configuração:

```txt
src/config/api.ts
```

Em ambiente web local, `localhost` funciona normalmente.

Para execução em dispositivo físico via Expo Go, pode ser necessário trocar `localhost` pelo IP local da máquina:

```ts
export const API_BASE_URL = 'http://192.168.15.14:3333';
```

---

## Endpoints Utilizados

| Método | Endpoint | Descrição |
|:------:|:---------|:----------|
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

## Como Executar o Backend

Acesse a pasta do backend:

```bash
cd backend
```

Instale as dependências:

```bash
npm install
```

Execute o servidor:

```bash
npm run dev
```

O backend será iniciado em:

```txt
http://localhost:3333
```

Validação rápida:

```bash
curl http://localhost:3333/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "service": "arkive-backend"
}
```

---

## Configuração Oracle

O backend utiliza `node-oracledb` para conexão com o banco Oracle.

Configuração utilizada:

```env
ORACLE_USER=rm561996
ORACLE_PASSWORD=230602
ORACLE_CONNECT_STRING=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=oracle.fiap.com.br)(PORT=1521))(CONNECT_DATA=(SID=ORCL)))
PORT=3333
```

O projeto possui fallback interno para o ambiente acadêmico, garantindo conexão com o banco utilizado na demonstração mesmo sem configuração manual adicional.

---

## Como Executar o App

Na raiz do projeto:

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

Na raiz do projeto:

```bash
npx tsc --noEmit
```

No backend:

```bash
cd backend
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

---

*Maio de 2026 · FIAP 2TDSPO*
