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
