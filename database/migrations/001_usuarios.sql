CREATE TABLE IF NOT EXISTS usuarios (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  nome       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  criado_em  TEXT NOT NULL DEFAULT (datetime('now'))
);
