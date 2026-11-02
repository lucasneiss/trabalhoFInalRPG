const express = require('express');
const bcrypt = require('bcrypt');
const { Usuario } = require('../models');
const exigirAutenticacao = require('../middlewares/auth');

const router = express.Router();
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 12;

function usuarioPublico(usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    criadoEm: usuario.criadoEm,
  };
}

function regenerarSessao(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
}

function destruirSessao(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy((error) => (error ? reject(error) : resolve()));
  });
}

// POST /api/auth/register  { nome, email, senha }
router.post('/register', async (req, res, next) => {
  try {
    const body = req.body || {};
    const nome = typeof body.nome === 'string' ? body.nome.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const senha = typeof body.senha === 'string' ? body.senha : '';

    if (nome.length < 2 || nome.length > 60) {
      return res.status(400).json({ erro: 'O nome deve ter entre 2 e 60 caracteres.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return res.status(400).json({ erro: 'Informe um e-mail válido.' });
    }
    if (senha.length < 8 || Buffer.byteLength(senha, 'utf8') > 72) {
      return res.status(400).json({ erro: 'A senha deve ter ao menos 8 caracteres e no máximo 72 bytes.' });
    }

    const existente = await Usuario.findOne({ where: { email } });
    if (existente) {
      return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
    }

    const senhaHash = await bcrypt.hash(senha, BCRYPT_ROUNDS);
    const usuario = await Usuario.create({ nome, email, senhaHash });

    await regenerarSessao(req);
    req.session.userId = usuario.id;

    return res.status(201).json({ usuario: usuarioPublico(usuario) });
  } catch (error) {
    // Trata também corrida entre duas tentativas com o mesmo e-mail.
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
    }
    return next(error);
  }
});

// POST /api/auth/login  { email, senha }
router.post('/login', async (req, res, next) => {
  try {
    const body = req.body || {};
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const senha = typeof body.senha === 'string' ? body.senha : '';

    if (!email || !senha) {
      return res.status(400).json({ erro: 'Informe e-mail e senha.' });
    }

    const usuario = await Usuario.findOne({ where: { email } });
    const senhaCorreta = usuario && await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }

    // Evita session fixation: troca o identificador da sessão após autenticar.
    await regenerarSessao(req);
    req.session.userId = usuario.id;

    return res.json({ usuario: usuarioPublico(usuario) });
  } catch (error) {
    return next(error);
  }
});

// GET /api/auth/me
router.get('/me', exigirAutenticacao, (req, res) => {
  res.json({ usuario: usuarioPublico(req.user) });
});

// POST /api/auth/logout
router.post('/logout', async (req, res, next) => {
  try {
    if (req.session) await destruirSessao(req);
    res.clearCookie('connect.sid', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    return res.json({ mensagem: 'Logout realizado.' });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
