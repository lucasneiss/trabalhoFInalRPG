#!/usr/bin/env bash
# Configura o GitHub do grupo: repositório, proteção da main, labels, issues da Sprint 1 e quadro.
# Pré-requisitos: GitHub CLI (https://cli.github.com) instalado e logado:
#   gh auth login
#   gh auth refresh -s project      # permissão para o GitHub Projects
# Uso (na raiz do projeto, já com git init + commit inicial):
#   bash scripts/setup-github.sh NOME_REPO USUARIO_GITHUB colega1 colega2 colega3 colega4 colega5
set -euo pipefail

REPO="${1:?Informe o nome do repositório}"
OWNER="${2:?Informe seu usuário do GitHub}"
shift 2
COLEGAS=("$@")
FULL="$OWNER/$REPO"

echo "==> 1/5 Criando repositório $FULL e enviando o código"
gh repo create "$FULL" --private --source=. --remote=origin --push || true
git branch -M main && git push -u origin main

echo "==> 2/5 Convidando colegas"
for u in "${COLEGAS[@]}"; do
  gh api -X PUT "repos/$FULL/collaborators/$u" -f permission=push >/dev/null && echo "   convite enviado: $u"
done

echo "==> 3/5 Protegendo a main (sem push direto, PR com 1 aprovação)"
gh api -X PUT "repos/$FULL/branches/main/protection" --input - <<JSON || \
  echo "!! Não foi possível proteger a main (repositório privado em conta gratuita?). Torne o repositório público ou use GitHub Pro/Education."
{
  "required_status_checks": null,
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON

echo "==> 4/5 Labels e issues da Sprint 1"
for l in backend frontend ia-texto ia-imagem websocket banco docs sprint-1; do
  gh label create "$l" --repo "$FULL" --force >/dev/null
done
issue() { gh issue create --repo "$FULL" --title "$1" --label "$2,sprint-1" --body "$3" >/dev/null && echo "   $1"; }
issue "Criar repositório, proteger main e montar quadro" "docs" "Estimativa: 2. Critério: main protegida, quadro com 4 colunas."
issue "Modelar banco (migrações + schema.sql + models Sequelize)" "banco" "Estimativa: 3. Critério: 5 tabelas com FKs; npm start aplica as migrações."
issue "Estrutura de pastas, package.json e .env.example" "docs" "Estimativa: 2. Critério: npm install && npm start sobem o servidor."
issue "HTML/CSS das telas de Login e Cadastro (mock)" "frontend" "Estimativa: 3. Dados mockados; responsivo."
issue "Formulário de criação de personagem (mock)" "frontend" "Estimativa: 3. Campos: nome, classe, atributos, descrição física."
issue "Protótipo estático da tela principal do jogo" "frontend" "Estimativa: 5. Painel do mapa, mural de narrativa, ficha do personagem, campo de ação."
issue "Servidor Express base + rotas de teste" "backend" "Estimativa: 2."
issue "Cadastro com bcrypt + login por sessão" "backend" "Estimativa: 5. Rotas privadas protegidas."
issue "Serviço isolado do Gemini (texto) + chamada de teste" "ia-texto" "Estimativa: 3. Chave só no .env."
issue "System prompts do Mestre e formato JSON da resposta" "ia-texto" "Estimativa: 5."
issue "Serviço de imagem (Nano Banana/Imagen) isolado" "ia-imagem" "Estimativa: 3."
issue "Função de prompt de avatar + estilo padrão do grupo" "ia-imagem" "Estimativa: 3."
issue "Salvar imagem retornada (arquivo + caminho no banco)" "ia-imagem" "Estimativa: 3."
issue "Socket.io acoplado ao Express (conexão/desconexão)" "websocket" "Estimativa: 2."
issue "PoC: chat entre dois navegadores" "websocket" "Estimativa: 3."

echo "==> 5/5 Quadro no GitHub Projects"
PNUM=$(gh project create --owner "$OWNER" --title "RPG Multiplayer - Sprints" --format json --jq '.number')
gh project link "$PNUM" --owner "$OWNER" --repo "$FULL" >/dev/null || true
# Renomeia as opções do campo Status para as 4 colunas obrigatórias
PID=$(gh project view "$PNUM" --owner "$OWNER" --format json --jq '.id')
FID=$(gh project field-list "$PNUM" --owner "$OWNER" --format json --jq '.fields[] | select(.name=="Status") | .id')
gh api graphql -f query='
mutation($f:ID!){ updateProjectV2Field(input:{fieldId:$f, singleSelectOptions:[
 {name:"A Fazer",color:GRAY,description:""},
 {name:"Em Andamento",color:YELLOW,description:""},
 {name:"Em Revisão",color:BLUE,description:""},
 {name:"Concluído",color:GREEN,description:""}]}){ projectV2Field{ ... on ProjectV2SingleSelectField{ id } } } }' \
 -f f="$FID" >/dev/null || echo "!! Renomeie as colunas manualmente: Status > editar opções."
# Adiciona as issues ao quadro
for url in $(gh issue list --repo "$FULL" --limit 50 --json url --jq '.[].url'); do
  gh project item-add "$PNUM" --owner "$OWNER" --url "$url" >/dev/null
done
echo "Pronto! Quadro: https://github.com/users/$OWNER/projects/$PNUM"
echo "Falta só: Settings do projeto > Workflows: ative 'Item closed -> Done' e 'Pull request merged -> Done'."
