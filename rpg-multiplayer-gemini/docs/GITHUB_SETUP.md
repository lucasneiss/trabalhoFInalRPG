# Configuração do GitHub (passo a passo)

> Atalho: com o GitHub CLI instalado (`gh auth login` e `gh auth refresh -s project`), rode `bash scripts/setup-github.sh NOME_REPO SEU_USUARIO colega1 colega2 ...` e ele faz os itens 1 a 4 (e cria as 15 issues da Sprint 1). O passo a passo manual abaixo serve de alternativa.


## 1. Repositório
1. GitHub > New repository > nome `rpg-multiplayer-gemini` (privado) > sem README.
2. No computador, dentro da pasta do projeto:
   ```
   git init
   git add .
   git commit -m "chore: estrutura inicial do projeto"
   git branch -M main
   git remote add origin https://github.com/<usuario>/rpg-multiplayer-gemini.git
   git push -u origin main
   ```
3. Settings > Collaborators > adicionar os outros 5 integrantes (e o professor).

## 2. Proteção da main
Settings > Branches > Add branch ruleset (ou "Add rule") para `main`:
- [x] Require a pull request before merging
- [x] Required approvals: **1**
- [x] Dismiss stale approvals when new commits are pushed
- [x] Block force pushes
Obs.: em repositório privado de conta gratuita essa proteção pode exigir GitHub Pro/Team ou repositório público. Se não estiver disponível, combinem a regra "ninguém dá push na main" manualmente.

## 3. Quadro (GitHub Projects)
Projects > New project > Board. Colunas (campo Status):
`A Fazer` | `Em Andamento` | `Em Revisão` | `Concluído`
Ative os workflows automáticos: item fechado -> Concluído; PR aberto -> Em Revisão.
Crie um campo "Sprint" (iteração de 1 semana) e "Estimativa" (número).

## 4. Labels sugeridas
`backend`, `frontend`, `ia-texto`, `ia-imagem`, `websocket`, `banco`, `docs`, `bug`

## 5. Fluxo de cada tarefa
```
git checkout main && git pull
git checkout -b feature/12-nome-curto
# ...trabalhar...
git push -u origin feature/12-nome-curto
# abrir PR com "Closes #12" e pedir revisão de 1 colega
```
