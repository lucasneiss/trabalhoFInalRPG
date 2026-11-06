// Orquestra o Mestre do Jogo: monta contexto a partir dos models, chama texto.js e devolve/persiste o mundo.
// Mensagens e broadcast Socket.io são do Integrante 5; o cálculo de dados/vida é do Integrante 2 (services/regras).
const { gerarTexto } = require('./texto');
const P = require('./promptsMestre');
const S = require('./schemasMestre');

const TOM_PADRAO = 'épico e imersivo';
const modelos = () => require('../../models'); // lazy: facilita teste unitário

// ---------- helpers puros ----------
const infoSala = (sala, tom) => ({ nome: sala.nome, tema: sala.tema, tom: tom || TOM_PADRAO });

function lerDados(mapa) {
  const bruto = mapa.dados;
  if (!bruto) return {};
  try { return typeof bruto === 'string' ? JSON.parse(bruto) : bruto; } catch { return {}; }
}

/** MapaCenario (linha do banco) -> "local" que os prompts entendem. `ordem` é o id do local no grafo. */
function mapaParaLocal(mapa) {
  const d = lerDados(mapa);
  return {
    id: mapa.ordem, nome: mapa.nome, descricao: mapa.descricao,
    saidas: d.saidas || [], npcs: d.npcs || [], desafio: d.desafio || null,
  };
}

/** Mensagem (banco) -> {autor, texto} para o histórico dos prompts. Recebe em qualquer ordem. */
function historicoDeMensagens(mensagens) {
  return [...mensagens]
    .sort((a, b) => a.id - b.id)
    .filter((m) => m.tipo !== 'sistema')
    .map((m) => ({ autor: m.autorNome, texto: m.conteudo }));
}

/** Resposta do Gemini -> linhas de mapas_cenarios (sem sala_id). ordem = id do local. */
function mundoParaMapas(mundo) {
  return mundo.locais.map((l) => ({
    ordem: l.id, nome: l.nome, descricao: l.descricao, promptImagem: l.promptImagem,
    visitado: false,
    dados: JSON.stringify({ saidas: l.saidas || [], npcs: l.npcs || [], desafio: l.desafio || null }),
  }));
}

function parseJson(texto) {
  return JSON.parse(texto.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, '').trim());
}

async function jsonValidado(args, validar, opcoes, tentativas = 2) {
  let ultimo;
  for (let i = 0; i < tentativas; i += 1) {
    const texto = await gerarTexto(args, opcoes); // erros de API (incl. 429) sobem direto
    try {
      const obj = parseJson(texto);
      const erros = validar(obj);
      if (!erros.length) return obj;
      ultimo = new Error(`JSON do Mestre inválido: ${erros.join('; ')}`);
    } catch (e) { ultimo = e; }
  }
  const err = new Error(`O Mestre devolveu uma resposta inválida: ${String(ultimo.message).slice(0, 200)}`);
  err.status = 502; err.codigo = 'RESPOSTA_INVALIDA';
  throw err;
}

// ---------- API do Mestre ----------

/** (S1) chamada básica de teste. */
async function testarConexao(opcoes = {}) {
  const inicio = Date.now();
  const resposta = await gerarTexto({ contents: 'Responda apenas com a palavra: pronto', temperatura: 0 }, opcoes);
  return { ok: true, resposta: resposta.trim(), latenciaMs: Date.now() - inicio };
}

/** Só chama o Gemini: prelúdio + objetivo + locais. Não toca no banco. */
async function gerarMundo({ sala, jogadores = [], numLocais = 5 }, opcoes = {}) {
  const mundo = await jsonValidado(
    { system: P.sistemaMestre(sala), contents: P.promptGerarMundo({ jogadores, numLocais }), schema: S.schemaMundo },
    S.validarMundo, opcoes,
  );
  mundo.locais = [...mundo.locais].sort((a, b) => a.id - b.id);
  return mundo;
}

/**
 * Gera o mundo da sala e PERSISTE: sala.lore = prelúdio, sala.objetivo, mapas_cenarios (um por local),
 * sala.mapa_atual_id = primeiro local. Depois, o Int. 5 chama gerarImagemDoMapa(mapa) para cada mapa.
 * Devolve { sala, mapas, mundo }.
 */
async function gerarMundoDaSala(sala, { tom, numLocais = 5, deps = {}, ...opcoes } = {}) {
  const { sequelize, MapaCenario, Personagem } = deps.models || modelos();
  if (await MapaCenario.count({ where: { sala_id: sala.id } })) {
    const e = new Error('Esta sala já possui um mundo gerado.'); e.status = 409; throw e;
  }
  const jogadores = await Personagem.findAll({ where: { sala_id: sala.id } });
  const mundo = await gerarMundo({ sala: infoSala(sala, tom), jogadores, numLocais }, opcoes);

  return sequelize.transaction(async (transaction) => {
    const linhas = mundoParaMapas(mundo).map((l, i) => ({ ...l, sala_id: sala.id, visitado: i === 0 }));
    const mapas = await MapaCenario.bulkCreate(linhas, { transaction });
    // bulkCreate no SQLite nem sempre devolve os ids: recarrega para garantir
    const salvos = await MapaCenario.findAll({ where: { sala_id: sala.id }, order: [['ordem', 'ASC']], transaction });
    sala.lore = mundo.preludio;
    sala.objetivo = mundo.objetivoPrincipal;
    sala.mapa_atual_id = (salvos[0] || mapas[0]).id;
    await sala.save({ transaction });
    return { sala, mapas: salvos, mundo };
  });
}

/** (S4) Narra o desfecho de um resultado JÁ calculado pelo servidor (Int. 2). Não persiste. */
async function narrarDesfecho({ sala, mapa, personagem, acao, resultado, historico = [], tom }, opcoes = {}) {
  return jsonValidado(
    {
      system: P.sistemaMestre(infoSala(sala, tom)),
      contents: P.promptNarrarDesfecho({
        objetivo: sala.objetivo, local: mapaParaLocal(mapa), jogador: personagem, acao, resultado, historico,
      }),
      schema: S.schemaDesfecho,
    },
    S.validarDesfecho, opcoes,
  ); // { narracao, falasNpc?, gancho }
}

async function responderNpc({ sala, mapa, npc, personagem, fala, historico = [], tom }, opcoes = {}) {
  const texto = await gerarTexto({
    system: P.sistemaMestre(infoSala(sala, tom)),
    contents: P.promptDialogoNpc({ npc, local: mapaParaLocal(mapa), jogador: personagem, fala, historico }),
  }, opcoes);
  return { npc: npc.nome, fala: texto.trim() };
}

/** Narra a chegada a um novo mapa (o controle de qual mapa vem a seguir é do Int. 5). */
async function narrarTransicao({ sala, de, para, tom }, opcoes = {}) {
  const texto = await gerarTexto({
    system: P.sistemaMestre(infoSala(sala, tom)),
    contents: P.promptTransicao({ de: mapaParaLocal(de), para: mapaParaLocal(para), objetivo: sala.objetivo }),
  }, opcoes);
  return { narracao: texto.trim() };
}

module.exports = {
  testarConexao, gerarMundo, gerarMundoDaSala, narrarDesfecho, responderNpc, narrarTransicao,
  mapaParaLocal, historicoDeMensagens, mundoParaMapas, TOM_PADRAO,
};
