# Bolão da Copa

Aplicação `Next.js` para um bolão privado da Copa do Mundo entre amigos, com:

- site responsivo para desktop e mobile
- auth por convite com primeiro acesso via magic link
- palpites de jogos e pódio final
- ranking geral com desempate por acerto exato e depois resultado correto
- painel admin para convites, regras por fase e resultados oficiais
- fonte manual de resultados no v1, com `ResultsProvider` preparado para `API-Football`
- persistência planejada em `Postgres` puro

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
- fluxo de convite e admin já navegável para validar UX e regras

## Rotas principais

- `/` landing pública
- `/entrar` login por magic link ou senha
- `/convite/[token]` aceite de convite
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

## API-Football

Validei na documentação oficial em 21 de abril de 2026 que o plano grátis continua com:

- `100 requests/day`
- `10 requests/minute`
- endpoint de `fixtures` para data/league/season
- endpoint de `fixtures?live=LEAGUE_ID` para janela de jogos ao vivo

Fontes:

- https://www.api-football.com/pricing
- https://www.api-football.com/news/post/how-ratelimit-works
- https://www.api-football.com/news/post/how-to-get-started-with-api-football-the-complete-beginners-guide

Variáveis adicionais:

- `API_FOOTBALL_KEY`
- `API_FOOTBALL_BASE_URL`
- `API_FOOTBALL_LEAGUE_ID`
- `API_FOOTBALL_SEASON`
- `API_FOOTBALL_TIMEZONE`
- `INTERNAL_CRON_SECRET`

Endpoint interno de sync:

- `GET /api/providers/api-football/sync?mode=daily&date=YYYY-MM-DD`
- `GET /api/providers/api-football/sync?mode=live-window`

Envie `Authorization: Bearer $INTERNAL_CRON_SECRET` ou `x-cron-secret`.

Agenda recomendada para caber no free tier da Copa:

- `00:05` todos os dias: `mode=daily`
- `30 min` antes do primeiro jogo do dia: `mode=daily`
- durante janela ativa de jogos: `mode=live-window` a cada `10 minutos`

Essa estratégia é suficiente para uma competição única como a Copa e preserva margem dentro do limite diário. A documentação oficial também indica que fixtures futuros podem ser consultados uma vez por dia, enquanto partidas ao vivo exigem polling mais frequente.

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

## Observações

- O contrato `ResultsProvider` suporta provider mock e `API-Football`.
- Os grupos oficiais de 2026 estão espelhados no sample local e em seed SQL para o banco.
- A aplicação ainda usa store demo neste bootstrap inicial; a camada `Postgres` agora está preparada como direção oficial da persistência.
- Não há qualquer fluxo financeiro no app.
