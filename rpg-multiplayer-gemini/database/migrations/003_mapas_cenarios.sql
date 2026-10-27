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
