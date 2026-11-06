// ÚNICO ponto que chama a API de TEXTO (Gemini) — Mestre do Jogo e NPCs.
// A chave fica só no servidor (GEMINI_API_KEY). Segue o mesmo padrão de erro do imagem.js (LIMITE_429 + retryAfterSeg).
const { GoogleGenAI } = require('@google/genai');
const { eh429, lerRetryDelaySeg } = require('./imagem');

class TextoError extends Error {
  constructor(message, { status = 502, retryAfterSeg = null, codigo = 'TEXTO_ERRO' } = {}) {
    super(message);
    this.name = 'TextoError';
    this.status = status;
    this.retryAfterSeg = retryAfterSeg;
    this.codigo = codigo;
  }
}

const cfg = () => ({
  modelo: process.env.TEXT_MODEL || 'gemini-2.5-flash',
  tentativas: Number(process.env.TEXT_MAX_TENTATIVAS) || 3,
  esperaMaxMs: Number(process.env.TEXT_MAX_ESPERA_MS) || 15000,
});

let clientePadrao = null;
function obterCliente() {
  if (!clientePadrao) {
    if (!process.env.GEMINI_API_KEY) {
      throw new TextoError('GEMINI_API_KEY não configurada no servidor.', { status: 503, codigo: 'SEM_CHAVE' });
    }
    clientePadrao = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return clientePadrao;
}

// Trava global: depois de um 429, chamadas novas falham rápido em vez de martelar a API.
let bloqueadoAteMs = 0;
const segundosDeBloqueio = (agora = Date.now()) => Math.max(0, Math.ceil((bloqueadoAteMs - agora) / 1000));
const dormir = (ms) => new Promise((ok) => setTimeout(ok, ms));
const ehTransitorio = (e) => [500, 502, 503, 504].includes(Number(e && (e.status || e.code)));

/**
 * Gera texto (ou JSON, se `schema` for passado). Devolve a string bruta.
 * Em 429: espera (respeitando o retryDelay da API) e tenta de novo; se a espera for longa demais,
 * lança TextoError { status: 429, retryAfterSeg, codigo: 'LIMITE_429' }.
 * `opcoes.cliente` / `opcoes.dormir` existem para testes.
 */
async function gerarTexto({ system, contents, schema = null, temperatura = 0.9 }, opcoes = {}) {
  const { modelo, tentativas, esperaMaxMs } = cfg();
  const esperar = opcoes.dormir || dormir;

  const faltam = segundosDeBloqueio();
  if (faltam > 0) {
    throw new TextoError('O Mestre está sobrecarregado no momento. Tente novamente em instantes.', { status: 429, retryAfterSeg: faltam, codigo: 'LIMITE_429' });
  }
  const cliente = opcoes.cliente || obterCliente();

  for (let tentativa = 1; ; tentativa += 1) {
    try {
      const r = await cliente.models.generateContent({
        model: modelo,
        contents,
        config: {
          systemInstruction: system,
          temperature: temperatura,
          ...(schema ? { responseMimeType: 'application/json', responseSchema: schema } : {}),
        },
      });
      if (!r || !r.text) throw new TextoError('O modelo não devolveu texto (possível bloqueio de segurança).', { status: 422, codigo: 'SEM_TEXTO' });
      return r.text;
    } catch (erro) {
      if (erro instanceof TextoError) throw erro;
      const limite = eh429(erro);
      if (!limite && !ehTransitorio(erro)) {
        throw new TextoError(`Falha ao gerar texto: ${String(erro.message || erro).slice(0, 200)}`, { status: 502 });
      }
      const sugeridoSeg = lerRetryDelaySeg(erro);
      const backoffMs = Math.min(2 ** tentativa * 1000, 8000) + Math.floor(Math.random() * 500);
      const esperaMs = sugeridoSeg ? sugeridoSeg * 1000 : backoffMs;
      if (limite) bloqueadoAteMs = Math.max(bloqueadoAteMs, Date.now() + esperaMs);
      if (tentativa >= tentativas || esperaMs > esperaMaxMs) {
        if (limite) throw new TextoError('Limite de uso da IA de texto atingido (429). Tente novamente em instantes.', { status: 429, retryAfterSeg: Math.ceil(esperaMs / 1000), codigo: 'LIMITE_429' });
        throw new TextoError(`Falha ao gerar texto: ${String(erro.message || erro).slice(0, 200)}`, { status: 502 });
      }
      await esperar(esperaMs);
      bloqueadoAteMs = 0; // já esperamos; libera para a nova tentativa
    }
  }
}

function _resetarEstado() { bloqueadoAteMs = 0; clientePadrao = null; }

module.exports = { gerarTexto, TextoError, _resetarEstado };
