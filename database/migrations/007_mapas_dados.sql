-- Guarda saídas (ordens dos próximos locais), NPCs e desafio de cada mapa gerado pelo Mestre.
-- Peça ao Integrante 1 para colocar em database/migrations/ no mesmo formato das demais.
ALTER TABLE mapas_cenarios ADD COLUMN dados TEXT NOT NULL DEFAULT '{}';
