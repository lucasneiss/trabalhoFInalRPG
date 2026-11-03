const express = require('express');
const { Personagem } = require('../models');
const exigirAutenticacao = require('../middlewares/auth');
const { RegraInvalidaError } = require('../services/regras/gameRules');
const ficha = require('../services/regras/fichaPersonagem');
const { gerarAvatarDoPersonagem } = require('../services/ia/imagemPersonagem');
const { ImagemError } = require('../services/ia/imagem');

const router = express.Router();
router.use(exigirAutenticacao);

const publico = (p) => ({
  id: p.id, nome: p.nome, classe: p.classe,
  forca: p.forca, destreza: p.destreza, inteligencia: p.inteligencia, carisma: p.carisma,
  vidaMax: p.vidaMax, vidaAtual: p.vidaAtual, inventario: p.inventario,
  descricaoFisica: p.descricaoFisica, avatarUrl: p.avatarPath || null, criadoEm: p.criadoEm,
});

function idValido(valor) {
  const id = Number(valor);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function buscarDoUsuario(req, res) {
  const id = idValido(req.params.id);
  if (!id) { res.status(400).json({ erro: 'ID de personagem inválido.' }); return null; }
  const p = await Personagem.findOne({ where: { id, usuario_id: req.user.id } });
  if (!p) { res.status(404).json({ erro: 'Personagem não encontrado.' }); return null; }
  return p;
}

/** Converte falhas de imagem em estado/HTTP; 429 vira Retry-After. */
function falhaDeImagem(erro) {
  if (erro instanceof ImagemError) {
    return { status: erro.status, codigo: erro.codigo, mensagem: erro.message, retryAfterSeg: erro.retryAfterSeg };
  }
  if (erro && erro.status === 409) return { status: 409, codigo: 'EM_ANDAMENTO', mensagem: erro.message, retryAfterSeg: null };
  throw erro;
}

// GET /api/characters/rules  -> dados para montar o formulário
router.get('/rules', (req, res) => {
  res.json({
    classes: Object.keys(ficha.CLASSES),
    atributoMin: ficha.ATRIBUTO_MIN, atributoMax: ficha.ATRIBUTO_MAX, pontosTotais: ficha.PONTOS_TOTAIS,
    descricaoMin: ficha.DESC_MIN, descricaoMax: ficha.DESC_MAX,
  });
});

// GET /api/characters
router.get('/', async (req, res, next) => {
  try {
    const lista = await Personagem.findAll({ where: { usuario_id: req.user.id }, order: [['id', 'DESC']] });
    res.json({ personagens: lista.map(publico) });
  } catch (e) { next(e); }
});

// GET /api/characters/:id
router.get('/:id', async (req, res, next) => {
  try {
    const p = await buscarDoUsuario(req, res);
    if (p) res.json({ personagem: publico(p) });
  } catch (e) { next(e); }
});

// POST /api/characters  { nome, classe, forca, destreza, inteligencia, carisma, descricaoFisica }
// A ficha é SEMPRE salva primeiro. Se a imagem falhar (ex.: 429), o personagem continua criado
// e o cliente pode tentar de novo em POST /:id/avatar.
router.post('/', async (req, res, next) => {
  try {
    const dados = ficha.validarFicha(req.body || {});
    const personagem = await Personagem.create({ ...dados, usuario_id: req.user.id });

    let avatar = { status: 'gerado' };
    let httpStatus = 201;
    try {
      await gerarAvatarDoPersonagem(personagem);
    } catch (erro) {
      const f = falhaDeImagem(erro);
      avatar = { status: 'pendente', codigo: f.codigo, mensagem: f.mensagem, retryAfterSeg: f.retryAfterSeg };
      if (f.retryAfterSeg) res.set('Retry-After', String(f.retryAfterSeg));
    }
    res.status(httpStatus).json({ personagem: publico(personagem), avatar });
  } catch (e) {
    if (e instanceof RegraInvalidaError) return res.status(e.status).json({ erro: e.message });
    return next(e);
  }
});

// POST /api/characters/:id/avatar   (gera ou regenera o retrato a partir da descrição da ficha)
router.post('/:id/avatar', async (req, res, next) => {
  try {
    const p = await buscarDoUsuario(req, res);
    if (!p) return;
    try {
      await gerarAvatarDoPersonagem(p);
      return res.json({ personagem: publico(p) });
    } catch (erro) {
      const f = falhaDeImagem(erro);
      if (f.retryAfterSeg) res.set('Retry-After', String(f.retryAfterSeg));
      return res.status(f.status).json({ erro: f.mensagem, codigo: f.codigo, retryAfterSeg: f.retryAfterSeg });
    }
  } catch (e) { return next(e); }
});

module.exports = router;
