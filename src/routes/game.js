const express = require('express');
const { Personagem } = require('../models');
const exigirAutenticacao = require('../middlewares/auth');
const regras = require('../services/regras/gameRules');

const router = express.Router();
router.use(exigirAutenticacao);

// POST /api/game/characters/:id/actions
// A API valida o dono do personagem e calcula o resultado antes de qualquer narração por IA.
router.post('/characters/:id/actions', async (req, res, next) => {
  try {
    const personagemId = Number(req.params.id);
    if (!Number.isSafeInteger(personagemId) || personagemId <= 0) {
      return res.status(400).json({ erro: 'ID de personagem inválido.' });
    }

    const personagem = await Personagem.findOne({
      where: { id: personagemId, usuario_id: req.user.id },
    });
    if (!personagem) {
      return res.status(404).json({ erro: 'Personagem não encontrado.' });
    }

    const body = req.body || {};
    const { tipo } = body;
    let resultado;

    switch (tipo) {
      case 'teste_pericia':
        resultado = regras.testePericia({
          personagem,
          atributo: body.atributo,
          dificuldade: body.dificuldade,
        });
        break;
      case 'receber_dano':
        resultado = regras.aplicarDano(personagem, body.quantidade);
        break;
      case 'curar':
        resultado = regras.curar(personagem, body.quantidade);
        break;
      case 'adicionar_item':
        resultado = regras.adicionarItem(personagem, body.nome, body.quantidade ?? 1);
        break;
      case 'remover_item':
        resultado = regras.removerItem(personagem, body.nome, body.quantidade ?? 1);
        break;
      default:
        return res.status(400).json({ erro: 'Ação inválida.' });
    }

    // Só persiste se uma regra alterou o estado do personagem.
    if (['receber_dano', 'curar', 'adicionar_item', 'remover_item'].includes(tipo)) {
      await personagem.save();
    }

    return res.json({
      personagem: {
        id: personagem.id,
        nome: personagem.nome,
        vidaAtual: personagem.vidaAtual,
        vidaMax: personagem.vidaMax,
        inventario: personagem.inventario,
      },
      resultado,
      // O integrante da IA pode usar este objeto num prompt narrativo; não deve recalcular números.
      instrucaoParaNarracao: 'Narre somente os fatos do resultado fornecido. Não altere rolagem, total, dificuldade, vida ou inventário.',
    });
  } catch (error) {
    if (error instanceof regras.RegraInvalidaError) {
      return res.status(error.status).json({ erro: error.message });
    }
    return next(error);
  }
});

module.exports = router;
