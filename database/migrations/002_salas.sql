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
