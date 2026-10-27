require('dotenv').config();
const path = require('path');
const http = require('http');
const express = require('express');
const session = require('express-session');
const { Server } = require('socket.io');
const migrar = require('./config/migrate');
const { sequelize } = require('./models');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
}));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rotas, sockets e serviços entram nas próximas issues:
// app.use('/api/auth', require('./routes/auth'));      -> Integrante 3
// require('./sockets')(io);                             -> Integrante 6
// src/services/ia/                                      -> Integrantes 4 e 5

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
migrar()
  .then(() => sequelize.authenticate())
  .then(() => {
    server.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
  })
  .catch((e) => { console.error('Falha ao iniciar:', e.message); process.exit(1); });
