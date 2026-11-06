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
app.use('/api/auth', require('./routes/auth'));
app.use('/api/game', require('./routes/game'));
app.use('/api/characters', require('./routes/personagens'));
app.use('/api/maps', require('./routes/mapas'));

// Sockets entram na próxima issue:
// require('./sockets')(io);                             -> Integrante 6

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
migrar()
  .then(() => sequelize.authenticate())
  .then(() => {
    server.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
  })
  .catch((e) => { console.error('Falha ao iniciar:', e.message); process.exit(1); });
