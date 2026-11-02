const { Usuario } = require('../models');

/** Exige uma sessão autenticada e disponibiliza o usuário em req.user. */
async function exigirAutenticacao(req, res, next) {
  try {
    const userId = req.session && req.session.userId;
    if (!userId) {
      return res.status(401).json({ erro: 'Autenticação necessária.' });
    }

    const usuario = await Usuario.findByPk(userId, {
      attributes: ['id', 'nome', 'email', 'criadoEm'],
    });

    if (!usuario) {
      req.session.destroy(() => {});
      return res.status(401).json({ erro: 'Sessão inválida. Faça login novamente.' });
    }

    req.user = usuario;
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = exigirAutenticacao;
