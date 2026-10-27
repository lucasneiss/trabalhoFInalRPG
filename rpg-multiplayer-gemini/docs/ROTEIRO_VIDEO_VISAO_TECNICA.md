# Roteiro da "Visão Técnica Rápida" (parte do vídeo — ~1 min)

Tela: VS Code aberto no projeto.

1. **.env.example (15 s)**
   Abrir `.env.example`. Falar: "Aqui estão só os NOMES das variáveis, sem valores. Quem baixa o projeto copia para `.env` e preenche a própria chave."
   Mostrar `GEMINI_API_KEY=` vazia, `SESSION_SECRET` e `DB_STORAGE`.

2. **Proteção da chave (20 s)**
   Abrir `.gitignore` e apontar a linha `.env`. Falar: "O `.env` real nunca vai para o GitHub nem para o ZIP."
   No GitHub, mostrar o repositório sem o arquivo `.env` na listagem.

3. **Rota que chama a IA (25 s)** — com os Integrantes 4 e 5
   Abrir o arquivo da rota/controller que dispara o Gemini e o serviço em `src/services/ia/`.
   Falar: "O navegador nunca fala com o Gemini. Ele chama nossa rota Express; só o servidor lê `process.env.GEMINI_API_KEY`."
   Mostrar que `public/` não contém a palavra "GEMINI" (opcional: busca global no VS Code).

Dica: gravar já com o `.env` fechado e o terminal limpo, para não expor a chave sem querer.
