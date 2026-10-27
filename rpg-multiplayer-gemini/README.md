# RPG Multiplayer com Gemini

Plataforma web de RPG de texto cooperativo em tempo real onde o Gemini é o Mestre do Jogo.

## Como rodar
```
npm install
cp .env.example .env     # preencha GEMINI_API_KEY e SESSION_SECRET
npm start
```
Acesse http://localhost:3000 (teste: http://localhost:3000/health).

O banco SQLite é criado/atualizado automaticamente ao iniciar (migrações em `database/migrations/`). Comandos úteis: `npm run db:migrate` (aplica pendentes) e `npm run db:reset` (apaga e recria o banco local).

## Estrutura
Veja `docs/ARQUITETURA.md`. Fluxo de Git e quadro: `docs/GITHUB_SETUP.md`.

## Equipe
| Integrante | Área |
|---|---|
| 1 | DevOps, Banco, Scrum Master (Sprint 1) |
| 2 | Front-End |
| 3 | Back-End / Autenticação |
| 4 | IA textual (Mestre) |
| 5 | IA visual (imagens) |
| 6 | WebSockets |
