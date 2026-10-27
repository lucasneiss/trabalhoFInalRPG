# Arquitetura (rascunho da Sprint 1)

Front (HTML/CSS/JS) <-> Express + Socket.io <-> SQLite (Sequelize) <-> Gemini / Nano Banana

## Camadas
- `src/routes` -> define as URLs
- `src/controllers` -> recebe a requisição e chama os serviços
- `src/services/ia` -> ÚNICO lugar que fala com o Gemini (texto e imagem)
- `src/services/regras` -> dados D20, vida, inventário (o servidor manda; a IA só narra)
- `src/sockets` -> eventos em tempo real
- `src/models` -> tabelas (Sequelize), espelhando `database/schema.sql`

## Donos por pasta (evita conflito de merge)
| Pasta | Integrante |
|---|---|
| infra, `database/`, `src/models/`, `src/config/` | 1 |
| `public/`, `views/` | 2 |
| `src/routes/auth*`, `src/controllers/`, `src/middlewares/` | 3 |
| `src/services/ia/mestre*` | 4 |
| `src/services/ia/imagem*` | 5 |
| `src/sockets/` | 6 |
