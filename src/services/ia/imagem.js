// ÚNICO ponto que chama a API de imagem (Nano Banana / Imagen via @google/genai).
// A chave fica só no servidor (GEMINI_API_KEY); o navegador nunca fala com o Google.
const { GoogleGenAI } = require('@google/genai');

class ImagemError extends Error {
  constructor(message, { status = 502, retryAfterSeg = null, codigo = 'IMAGEM_ERRO' } = {}) {
    super(message);
    this.name = 'ImagemError';
    this.status = status;
    this.retryAfterSeg = retryAfterSeg;
    this.codigo = codigo;
  }
}

const cfg = () => ({
  modelo: process.env.IMAGE_MODEL || 'gemini-2.5-flash-image', // Nano Banana. Para Imagen: 'imagen-4.0-generate-001'
  tentativas: Number(process.env.IMAGE_MAX_TENTATIVAS) || 3,
  esperaMaxMs: Number(process.env.IMAGE_MAX_ESPERA_MS) || 15000,
  concorrencia: Number(process.env.IMAGE_CONCORRENCIA) || 2,
});

let clientePadrao = null;
function obterCliente() {
  if (!clientePadrao) {
    if (!process.env.GEMINI_API_KEY) {
      throw new ImagemError('GEMINI_API_KEY não configurada no servidor.', { status: 503, codigo: 'SEM_CHAVE' });
    }
    clientePadrao = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return clientePadrao;
}

// ---- 429 -------------------------------------------------------------------
function eh429(erro) {
  if (!erro) return false;
  if (erro.status === 429 || erro.code === 429) return true;
  return /\b429\b|RESOURCE_EXHAUSTED|quota|rate.?limit/i.test(String(erro.message || ''));
}

/** Lê o "retryDelay" (ex.: "37s") que a API costuma enviar junto do 429. Retorna segundos ou null. */
function lerRetryDelaySeg(erro) {
  const m = String(erro && erro.message || '').match(/retryDelay"?\s*[:=]\s*"?(\d+(?:\.\d+)?)s/i)
    || String(erro && erro.message || '').match(/retry in (\d+(?:\.\d+)?)s/i);
  return m ? Math.ceil(Number(m[1])) : null;
}

// Trava global: depois de um 429, chamadas novas falham rápido em vez de martelar a API.
let bloqueadoAteMs = 0;
function segundosDeBloqueio(agora = Date.now()) {
  return Math.max(0, Math.ceil((bloqueadoAteMs - agora) / 1000));
}

// ---- Fila simples (limita chamadas simultâneas) -----------------------------
let emUso = 0;
const fila = [];
async function adquirir() {
  if (emUso < cfg().concorrencia) { emUso += 1; return; }
  await new Promise((ok) => fila.push(ok));
}
function liberar() {
  const proximo = fila.shift();
  if (proximo) proximo(); else emUso -= 1;
}

const dormir = (ms) => new Promise((ok) => setTimeout(ok, ms));

// ---- Chamada ao modelo -------------------------------------------------------
async function chamarModelo(cliente, modelo, prompt) {
  if (/^imagen/i.test(modelo)) {
    const r = await cliente.models.generateImages({
      model: modelo,
      prompt,
      config: { numberOfImages: 1 },
    });
    const img = r && r.generatedImages && r.generatedImages[0] && r.generatedImages[0].image;
    if (!img || !img.imageBytes) {
      throw new ImagemError('O modelo não devolveu imagem (possível bloqueio de segurança).', { status: 422, codigo: 'SEM_IMAGEM' });
    }
    return { buffer: Buffer.from(img.imageBytes, 'base64'), mimeType: img.mimeType || 'image/png' };
  }

  const r = await cliente.models.generateContent({
    model: modelo,
    contents: prompt,
    config: { responseModalities: ['IMAGE'] },
  });
  const partes = (r && r.candidates && r.candidates[0] && r.candidates[0].content && r.candidates[0].content.parts) || [];
  const parte = partes.find((p) => p.inlineData && p.inlineData.data);
  if (!parte) {
    throw new ImagemError('O modelo não devolveu imagem (possível bloqueio de segurança).', { status: 422, codigo: 'SEM_IMAGEM' });
  }
  return { buffer: Buffer.from(parte.inlineData.data, 'base64'), mimeType: parte.inlineData.mimeType || 'image/png' };
}

/**
 * Gera UMA imagem a partir de um prompt já montado.
 * Em 429: espera (respeitando o retryDelay da API) e tenta de novo; se a espera for longa demais,
 * lança ImagemError { status: 429, retryAfterSeg } para a rota responder 429 + Retry-After.
 * `opcoes.cliente` / `opcoes.dormir` existem para testes.
 */
async function gerarImagem(prompt, opcoes = {}) {
  const { modelo, tentativas, esperaMaxMs } = cfg();
  const esperar = opcoes.dormir || dormir;

  const faltam = segundosDeBloqueio();
  if (faltam > 0) {
    throw new ImagemError('Muitas gerações de imagem no momento. Tente novamente em instantes.', { status: 429, retryAfterSeg: faltam, codigo: 'LIMITE_429' });
  }

  const cliente = opcoes.cliente || obterCliente();
  await adquirir();
  try {
    for (let tentativa = 1; ; tentativa += 1) {
      try {
        return await chamarModelo(cliente, modelo, prompt);
      } catch (erro) {
        if (erro instanceof ImagemError) throw erro;
        if (!eh429(erro)) {
          throw new ImagemError(`Falha ao gerar imagem: ${String(erro.message || erro).slice(0, 200)}`, { status: 502 });
        }
        const sugeridoSeg = lerRetryDelaySeg(erro);
        const backoffMs = Math.min(2 ** tentativa * 1000, 8000) + Math.floor(Math.random() * 500);
        const esperaMs = sugeridoSeg ? sugeridoSeg * 1000 : backoffMs;
        const retryAfterSeg = Math.ceil(esperaMs / 1000);
        bloqueadoAteMs = Math.max(bloqueadoAteMs, Date.now() + esperaMs);
        if (tentativa >= tentativas || esperaMs > esperaMaxMs) {
          throw new ImagemError('Limite de uso da API de imagem atingido (429). Tente novamente em instantes.', { status: 429, retryAfterSeg, codigo: 'LIMITE_429' });
        }
        await esperar(esperaMs);
        bloqueadoAteMs = 0; // já esperamos; libera para a nova tentativa
      }
    }
  } finally {
    liberar();
  }
}

function _resetarEstado() { bloqueadoAteMs = 0; emUso = 0; fila.length = 0; clientePadrao = null; }

module.exports = { gerarImagem, ImagemError, eh429, lerRetryDelaySeg, _resetarEstado };
