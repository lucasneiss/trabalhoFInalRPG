require('dotenv').config();
require('../src/config/migrate')().then(
  () => console.log('Banco atualizado.'),
  (e) => { console.error(e.message); process.exit(1); }
);
