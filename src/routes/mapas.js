const express = require('express');
const { MapaCenario, Sala } = require('../models');
const exigirAutenticacao = require('../middlewares/auth');
const { gerarImagemDoMapa } = require('../services/ia/imagemPersonagem');
const { ImagemError } = require('../services/ia/imagem');

const router = express.Router();
router.use(exigirAutenticacao);

// POST /api/maps/:id/image  -> gera a imagem do cenário a partir de mapa.promptImagem (devolvido pelo Gemini).
// Só o host da sala pode disparar (custo de API). O módulo do Mestre também pode chamar gerarImagemDoMapa(mapa) direto.
router.post('/:id/image', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ erro: 'ID de mapa inválido.' });

    const mapa = await MapaCenario.findByPk(id);
    const sala = mapa && await Sala.findByPk(mapa.sala_id);
    if (!mapa || !sala || sala.host_id !== req.user.id) {
      return res.status(404).json({ erro: 'Mapa não encontrado.' });
    }
    if (!mapa.promptImagem && !mapa.descricao) {
      return res.status(400).json({ erro: 'O mapa não tem prompt de imagem.' });
    }

    try {
      await gerarImagemDoMapa(mapa);
      return res.json({ mapa: { id: mapa.id, nome: mapa.nome, imagemUrl: mapa.imagemPath } });
    } catch (erro) {
      if (erro instanceof ImagemError) {
        if (erro.retryAfterSeg) res.set('Retry-After', String(erro.retryAfterSeg));
        return res.status(erro.status).json({ erro: erro.message, codigo: erro.codigo, retryAfterSeg: erro.retryAfterSeg });
      }
      if (erro && erro.status === 409) return res.status(409).json({ erro: erro.message });
      throw erro;
    }
  } catch (e) { return next(e); }
});

module.exports = router;
