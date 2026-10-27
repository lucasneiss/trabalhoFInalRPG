// Aplica, em ordem, as migrações de database/migrations que ainda não rodaram.
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');

const DIR = path.join(__dirname, '..', '..', 'database', 'migrations');
const dbPath = () => path.resolve(process.env.DB_STORAGE || './database/rpg.sqlite');

const run = (db, sql) => new Promise((ok, fail) => db.exec(sql, (e) => (e ? fail(e) : ok())));
const all = (db, sql) => new Promise((ok, fail) => db.all(sql, (e, r) => (e ? fail(e) : ok(r))));

async function migrar() {
  fs.mkdirSync(path.dirname(dbPath()), { recursive: true });
  const db = new sqlite3.Database(dbPath());
  try {
    await run(db, 'PRAGMA foreign_keys = ON;');
    await run(db, `CREATE TABLE IF NOT EXISTS migracoes (
      nome TEXT PRIMARY KEY, aplicada_em TEXT NOT NULL DEFAULT (datetime('now')));`);
    const feitas = new Set((await all(db, 'SELECT nome FROM migracoes')).map((r) => r.nome));
    const arquivos = fs.readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort();
    for (const arq of arquivos) {
      if (feitas.has(arq)) continue;
      await run(db, 'BEGIN;');
      try {
        await run(db, fs.readFileSync(path.join(DIR, arq), 'utf8'));
        await run(db, `INSERT INTO migracoes (nome) VALUES ('${arq}');`);
        await run(db, 'COMMIT;');
        console.log('Migração aplicada:', arq);
      } catch (e) {
        await run(db, 'ROLLBACK;');
        throw new Error(`Falha em ${arq}: ${e.message}`);
      }
    }
  } finally {
    db.close();
  }
}

module.exports = migrar;
