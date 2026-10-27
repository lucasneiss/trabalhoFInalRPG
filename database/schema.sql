-- Schema consolidado (gerado a partir de database/migrations/*.sql). Referência para o professor/slides.
PRAGMA foreign_keys = ON;

-- 001_usuarios.sql
CREATE TABLE IF NOT EXISTS usuarios (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  nome       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  criado_em  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 002_salas.sql
-- mapa_atual_id referencia mapas_cenarios (criada na migração 003); o SQLite aceita a referência antecipada.
CREATE TABLE IF NOT EXISTS salas (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo        TEXT NOT NULL UNIQUE,
  nome          TEXT NOT NULL,
  tema          TEXT NOT NULL,
  host_id       INTEGER NOT NULL,
  lore          TEXT,
  objetivo      TEXT,
  status        TEXT NOT NULL DEFAULT 'aguardando'
                CHECK (status IN ('aguardando','em_andamento','encerrada')),
  mapa_atual_id INTEGER,
  criado_em     TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (host_id)       REFERENCES usuarios(id)       ON DELETE CASCADE,
  FOREIGN KEY (mapa_atual_id) REFERENCES mapas_cenarios(id) ON DELETE SET NULL
);

-- 003_mapas_cenarios.sql
CREATE TABLE IF NOT EXISTS mapas_cenarios (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  sala_id       INTEGER NOT NULL,
  ordem         INTEGER NOT NULL DEFAULT 0,
  nome          TEXT NOT NULL,
  descricao     TEXT NOT NULL,
  prompt_imagem TEXT,
  imagem_path   TEXT,
  visitado      INTEGER NOT NULL DEFAULT 0 CHECK (visitado IN (0,1)),
  criado_em     TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (sala_id) REFERENCES salas(id) ON DELETE CASCADE
);

-- 004_personagens.sql
CREATE TABLE IF NOT EXISTS personagens (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id       INTEGER NOT NULL,
  sala_id          INTEGER,
  nome             TEXT NOT NULL,
  classe           TEXT NOT NULL,
  forca            INTEGER NOT NULL DEFAULT 10,
  destreza         INTEGER NOT NULL DEFAULT 10,
  inteligencia     INTEGER NOT NULL DEFAULT 10,
  carisma          INTEGER NOT NULL DEFAULT 10,
  vida_max         INTEGER NOT NULL DEFAULT 20,
  vida_atual       INTEGER NOT NULL DEFAULT 20,
  inventario       TEXT NOT NULL DEFAULT '[]',
  descricao_fisica TEXT NOT NULL,
  avatar_path      TEXT,
  criado_em        TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (sala_id)    REFERENCES salas(id)    ON DELETE SET NULL
);

-- 005_mensagens.sql
CREATE TABLE IF NOT EXISTS mensagens (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  sala_id       INTEGER NOT NULL,
  personagem_id INTEGER,
  tipo          TEXT NOT NULL DEFAULT 'jogador'
                CHECK (tipo IN ('jogador','mestre','npc','sistema')),
  autor_nome    TEXT NOT NULL,
  conteudo      TEXT NOT NULL,
  criado_em     TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (sala_id)       REFERENCES salas(id)       ON DELETE CASCADE,
  FOREIGN KEY (personagem_id) REFERENCES personagens(id) ON DELETE SET NULL
);

-- 006_indices.sql
CREATE INDEX IF NOT EXISTS idx_personagens_usuario ON personagens(usuario_id);
CREATE INDEX IF NOT EXISTS idx_personagens_sala    ON personagens(sala_id);
CREATE INDEX IF NOT EXISTS idx_mapas_sala          ON mapas_cenarios(sala_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_sala      ON mensagens(sala_id, criado_em);

