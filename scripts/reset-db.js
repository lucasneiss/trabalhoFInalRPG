// Apaga o banco local e reaplica todas as migrações (APAGA OS DADOS!)
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const p = path.resolve(process.env.DB_STORAGE || './database/rpg.sqlite');
if (fs.existsSync(p)) fs.unlinkSync(p);
require('../src/config/migrate')().then(
  () => console.log('Banco recriado em', p),
  (e) => { console.error(e.message); process.exit(1); }
);
