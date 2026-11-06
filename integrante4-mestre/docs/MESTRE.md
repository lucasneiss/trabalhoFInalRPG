# Mestre do Jogo (Gemini texto) — Integrante 4

## Arquivos (src/services/ia/)
| Arquivo | Papel |
|---|---|
| `texto.js` | Único ponto que chama o Gemini de texto. Retry, trava global e `TextoError` (mesmo padrão do `imagem.js`). |
| `promptsMestre.js` | Todos os prompts (slide 4). |
| `schemasMestre.js` | JSON estruturado + validação (ids/saídas, perícias da ficha). |
| `mestre.js` | API pública: lê/grava nos models e chama `texto.js`. |

## Pré-requisito (1x)
Aplicar `docs/migracao_mapas_dados.sql` e o patch de `docs/PATCH_MapaCenario.txt` (coluna `dados`).
Sem ela tudo funciona, mas NPCs, desafios e saídas do mapa não ficam salvos.

## API
| Função | Quem chama | Retorno |
|---|---|---|
| `testarConexao()` | todos | `{ok, resposta, latenciaMs}` |
| `gerarMundoDaSala(sala, {tom, numLocais})` | Int. 5 (ao iniciar a aventura) | `{sala, mapas, mundo}`; grava `sala.lore`, `sala.objetivo`, `mapas_cenarios`, `sala.mapa_atual_id` |
| `narrarDesfecho({sala, mapa, personagem, acao, resultado, historico})` | Int. 5, após Int. 2 calcular | `{narracao, falasNpc?, gancho}` (não persiste) |
| `responderNpc({sala, mapa, npc, personagem, fala, historico})` | Int. 5 | `{npc, fala}` |
| `narrarTransicao({sala, de, para})` | Int. 5 | `{narracao}` |
| `mapaParaLocal(mapa)`, `historicoDeMensagens(msgs)` | Int. 5 | helpers |

### Fluxo sugerido (Int. 5)
```js
const { mapas } = await mestre.gerarMundoDaSala(sala);          // texto + mapas no banco
mapas.forEach((m) => gerarImagemDoMapa(m).then(emitirMapa));    // Int. 3, em segundo plano (latência!)
// por ação do jogador:
const resultado = regras.resolverAcao(personagem, acao);        // Int. 2 (números)
const historico = mestre.historicoDeMensagens(ultimas10);
const d = await mestre.narrarDesfecho({ sala, mapa, personagem, acao, resultado, historico });
// salvar Mensagem(tipo 'mestre', conteudo d.narracao + d.gancho) e emitir via Socket.io
```
`resultado` é livre (vai como JSON em `<RESULTADO>`); sugerido:
`{pericia:'forca', d20:14, modificador:2, total:16, dificuldade:12, sucesso:true, critico:false, vidaAntes:20, vidaDepois:20}`.
`local.ordem` é o id do local; `saidas` em `dados` são `ordem`s dos próximos mapas (para a transição).
O tom não tem coluna em `salas`: passe `{tom}` ou o padrão "épico e imersivo" é usado (ou grave "tema — tom" em `sala.tema`).

## Erro 429
`TextoError { status: 429, codigo: 'LIMITE_429', retryAfterSeg }` — igual ao `ImagemError`.
Int. 5: capturar e emitir um evento (ex.: `aviso:limite`) com `retryAfterSeg`; Int. 6 mostra o aviso.
Rotas HTTP: responder 429 + header `Retry-After`.

## Engenharia de prompt (slide 4)
1. Papel + contexto fixo na `systemInstruction` (aventura, tema, tom).
2. **Servidor manda, IA narra**: números em `<RESULTADO>`; proibido alterar.
3. Delimitadores XML + anti prompt-injection (ação do jogador é conteúdo, texto sanitizado com `limparTexto`).
4. Saída estruturada (`responseSchema`) + validação própria e uma nova tentativa.
5. `promptImagem` em inglês, só ambiente; o estilo visual vem do `estiloImagem.js` (padrão do grupo).
