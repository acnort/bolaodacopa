# Bolão da Copa

Aplicação `Next.js` para um bolão privado da Copa do Mundo entre amigos, com:

- site responsivo para desktop e mobile
- cadastro público com aprovação manual por admin
- acesso privado por email aprovado e sessão via cookie HTTP-only
- palpites de jogos e pódio final
- ranking geral com desempate por acerto exato e depois resultado correto
- painel admin para solicitações de cadastro, membros, regras por fase e resultados oficiais
- fonte manual de resultados no v1, com `ResultsProvider` integrado ao `football-data.org`
- persistência em `Postgres` puro, com fallback demo em memória

## Stack

- `Next.js 16` + `App Router`
- `TypeScript`
- `Tailwind CSS 4`
- componentes inspirados em `shadcn/ui` com `Radix UI`
- `Postgres`
- `node-postgres (pg)` para a camada de acesso ao banco
- `Vitest` + Testing Library

## Rodando localmente

```bash
npm install
npm run db:up
npm run db:migrate
npm run dev
```

Abra `http://localhost:3000`.

## Postgres local com Docker

Para desenvolvimento local, o projeto sobe um `Postgres 16` via `docker compose`:

```bash
npm run db:up
npm run db:migrate
```

Defaults locais:

- host: `localhost`
- porta: `5433`
- database: `bolaov2`
- user: `postgres`
- password: `postgres`

Connection string padrão do `.env.example`:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5433/bolaov2
```

Comandos úteis:

```bash
npm run db:up
npm run db:down
npm run db:reset
npm run db:logs
npm run db:migrate
```

## Modo demo

Sem `DATABASE_URL` configurada, a aplicação roda em modo demonstrativo com:

- snapshot inicial em memória
- server actions reais
- persistência temporária durante a sessão do servidor
- fluxo de cadastro, login por email aprovado e admin já navegável para validar UX e regras

## Rotas principais

- `/` landing pública
- `/cadastro` solicitação pública de acesso
- `/cadastro/status/[token]` acompanhamento da solicitação
- `/entrar` login por email já aprovado
- `/convite/[token]` rota legada que redireciona para o status do cadastro
- `/app` ranking privado
- `/app/palpites` palpites por fase
- `/app/admin` painel administrativo

## Postgres

O schema inicial está em:

- [database/migrations/202604210001_initial.sql](/c:/Documentos/projects/bolaov2/database/migrations/202604210001_initial.sql)

Seed com os grupos oficiais da Copa de 2026:

- [database/seeds/202604220001_world_cup_2026_groups.sql](/c:/Documentos/projects/bolaov2/database/seeds/202604220001_world_cup_2026_groups.sql)

Variáveis necessárias:

- `DATABASE_URL`
- `DATABASE_SSL`
- `AUTH_SECRET`
- `APP_URL`

Variáveis opcionais de desenvolvimento:

- `APP_CURRENT_USER_ID`
- `APP_CURRENT_USER_EMAIL`

Observação: o login atual é propositalmente simples para o MVP privado. Ele valida se o email já está aprovado e grava uma sessão assinada no cookie HTTP-only `bolao-user-id`.

## football-data.org

A integração automática de jogos/resultados usa `football-data.org` v4 para a Copa do Mundo 2026.

Limite informado para o plano free:

- `10 requests/minute`

Variáveis adicionais:

- `FOOTBALL_DATA_API_KEY` ou `API_FOOTBALL_KEY` como fallback legado
- `FOOTBALL_DATA_BASE_URL=https://api.football-data.org/v4`
- `FOOTBALL_DATA_COMPETITION_ID=2000`
- `INTERNAL_CRON_SECRET`

O provider chama:

- `GET /competitions/2000/matches`
- header `X-Auth-Token: $FOOTBALL_DATA_API_KEY`

O dashboard não chama a API externa no render. A sincronização acontece apenas via rota interna/cron para preservar a quota.

Endpoint interno de sync:

- `GET /api/providers/football-data/sync?mode=adaptive`
- `GET /api/providers/football-data/sync?mode=daily&date=YYYY-MM-DD`
- `GET /api/providers/football-data/sync?mode=live-window`

Envie `Authorization: Bearer $INTERNAL_CRON_SECRET` ou `x-cron-secret`.

Agenda recomendada para respeitar `10 requests/minute`:

- chamar `mode=adaptive` a cada minuto pelo cron
- o app só faz fetch externo quando a cadência permitir
- janela live: no máximo 1 sync por minuto
- dia de jogo fora da janela live: no máximo 1 sync a cada 5 minutos
- fora de dia de jogo: no máximo 1 sync a cada 6 horas

Cada sync do provider `football-data.org` usa 1 chamada externa para `/competitions/2000/matches`, que já traz status, próximos jogos e placares. A aplicação ainda mantém uma proteção interna de orçamento para não passar de 8 chamadas/minuto mesmo se houver chamadas manuais ou crons duplicados.

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

## Deploy na VPS

O projeto tem deploy via Docker e GitHub Actions, seguindo o padrão do `adminlab`.

Arquivos principais:

- [Dockerfile](/c:/Documentos/projects/bolaov2/Dockerfile)
- [docker-compose.prod.yml](/c:/Documentos/projects/bolaov2/docker-compose.prod.yml)
- [.github/workflows/deploy.yml](/c:/Documentos/projects/bolaov2/.github/workflows/deploy.yml)
- [.env.production.example](/c:/Documentos/projects/bolaov2/.env.production.example)

No servidor, crie:

```bash
/usr/documents/projects/bolaov2/.env
```

Baseie no `.env.production.example`. O compose sobe:

- `bolaov2`: app Next.js em `APP_PORT`, default `3102`
- `bolaov2-db`: Postgres 16 com volume `bolaov2-postgres`
- `bolaov2-results-sync`: chamada por minuto para `mode=adaptive`

Secrets esperados no GitHub:

- `HOST`
- `USERNAME`
- `PORT`
- `SSHKEY`

O workflow roda `typecheck`, `lint`, `test`, `build` e depois executa no servidor:

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build --remove-orphans
```

As migrations SQL rodam automaticamente no startup do container da aplicação via `npm run db:migrate`.

## Observações

- O contrato `ResultsProvider` suporta provider mock, `football-data.org` e fallback legado de `API-Football`.
- Os grupos oficiais de 2026 estão espelhados no sample local e em seed SQL para o banco.
- Sem `DATABASE_URL`, a aplicação usa store demo em memória; com `DATABASE_URL`, usa Postgres.
- O fluxo antigo de convites foi substituído por solicitações de cadastro aprovadas no admin.
- Não há qualquer fluxo financeiro no app.
