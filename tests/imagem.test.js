const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('os');
const fs = require('fs');
const path = require('path');

process.env.UPLOADS_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'rpg-up-'));
process.env.IMAGE_MODEL = 'gemini-2.5-flash-image';

const img = require('../src/services/ia/imagem');
const { salvarImagem } = require('../src/services/ia/armazenamentoImagem');
const { montarPromptRetrato } = require('../src/services/ia/estiloImagem');
const { validarFicha } = require('../src/services/regras/fichaPersonagem');

const PNG = Buffer.from('iVBORw0KGgo=', 'base64').toString('base64');
const clienteOk = () => ({ models: { generateContent: async () => ({ candidates: [{ content: { parts: [{ inlineData: { data: PNG, mimeType: 'image/png' } }] } }] }) } });
const erro429 = (msg = '429 RESOURCE_EXHAUSTED') => Object.assign(new Error(msg), { status: 429 });

test.beforeEach(() => img._resetarEstado());

test('gera imagem pelo Nano Banana', async () => {
  const r = await img.gerarImagem('x', { cliente: clienteOk() });
  assert.equal(r.mimeType, 'image/png');
  assert.ok(r.buffer.length > 0);
});

test('429: tenta de novo e funciona', async () => {
  let n = 0;
  const cliente = { models: { generateContent: async () => { if (++n < 3) throw erro429(); return clienteOk().models.generateContent(); } } };
  const r = await img.gerarImagem('x', { cliente, dormir: async () => {} });
  assert.equal(n, 3);
  assert.ok(r.buffer);
});

test('429 persistente vira ImagemError 429 com retryAfterSeg', async () => {
  const cliente = { models: { generateContent: async () => { throw erro429(); } } };
  await assert.rejects(img.gerarImagem('x', { cliente, dormir: async () => {} }),
    (e) => e.status === 429 && e.retryAfterSeg > 0);
});

test('retryDelay longo da API não trava a requisição', async () => {
  let n = 0;
  const cliente = { models: { generateContent: async () => { n++; throw erro429('429 {"retryDelay":"45s"}'); } } };
  await assert.rejects(img.gerarImagem('x', { cliente, dormir: async () => {} }), (e) => e.status === 429 && e.retryAfterSeg === 45);
  assert.equal(n, 1);
  // trava global: próxima chamada falha rápido, sem tocar na API
  await assert.rejects(img.gerarImagem('x', { cliente }), (e) => e.codigo === 'LIMITE_429');
  assert.equal(n, 1);
});

test('erro que não é 429 não é repetido', async () => {
  let n = 0;
  const cliente = { models: { generateContent: async () => { n++; throw new Error('boom'); } } };
  await assert.rejects(img.gerarImagem('x', { cliente, dormir: async () => {} }), (e) => e.status === 502);
  assert.equal(n, 1);
});

test('resposta sem imagem vira 422', async () => {
  const cliente = { models: { generateContent: async () => ({ candidates: [{ content: { parts: [{ text: 'não' }] } }] }) } };
  await assert.rejects(img.gerarImagem('x', { cliente }), (e) => e.status === 422);
});

test('salva arquivo dentro de uploads e devolve URL pública', async () => {
  const url = await salvarImagem({ buffer: Buffer.from(PNG, 'base64'), mimeType: 'image/png' }, 'avatar');
  assert.match(url, /^\/uploads\/avatars\/[0-9a-f-]+\.png$/);
  assert.ok(fs.existsSync(path.join(process.env.UPLOADS_DIR, url.replace('/uploads/', ''))));
  await assert.rejects(salvarImagem({ buffer: Buffer.from('a'), mimeType: 'text/html' }, 'avatar'));
});

test('prompt combina estilo do grupo + descrição do jogador', () => {
  const p = montarPromptRetrato({ nome: 'Ayla', classe: 'mago', descricaoFisica: 'Elfa de cabelos prateados\ne cicatriz no olho.' });
  assert.match(p, /painterly concept art/);
  assert.match(p, /cabelos prateados e cicatriz/);
});

test('ficha: valida atributos, classe e calcula vida no servidor', () => {
  const ok = { nome: 'Ayla', classe: 'Clérigo', descricaoFisica: 'Elfa alta de cabelos prateados.', forca: 14, destreza: 12, inteligencia: 10, carisma: 12 };
  const f = validarFicha(ok);
  assert.equal(f.classe, 'clerigo');
  assert.equal(f.vidaMax, 26);
  assert.throws(() => validarFicha({ ...ok, forca: 16, destreza: 16, inteligencia: 16 }), /excede/);
  assert.throws(() => validarFicha({ ...ok, classe: 'dragão' }), /Classe inválida/);
  assert.throws(() => validarFicha({ ...ok, descricaoFisica: 'curta' }), /descrição/);
  assert.throws(() => validarFicha({ ...ok, forca: '14' }), /forca/);
});
