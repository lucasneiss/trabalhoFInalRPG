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
