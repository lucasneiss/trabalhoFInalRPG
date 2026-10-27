CREATE INDEX IF NOT EXISTS idx_personagens_usuario ON personagens(usuario_id);
CREATE INDEX IF NOT EXISTS idx_personagens_sala    ON personagens(sala_id);
CREATE INDEX IF NOT EXISTS idx_mapas_sala          ON mapas_cenarios(sala_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_sala      ON mensagens(sala_id, criado_em);
