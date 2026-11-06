// Uso: npm run test:gemini            -> chamada básica (S1)
//      npm run test:gemini -- --mundo -> gera um mundo de verdade (sem banco) e imprime o JSON
require('dotenv').config();
const mestre = require('../src/services/ia/mestre');

(async () => {
  try {
    console.log('Teste básico:', await mestre.testarConexao());
    if (process.argv.includes('--mundo')) {
      const mundo = await mestre.gerarMundo({
        sala: { nome: 'A Cripta Esquecida', tema: 'fantasia sombria', tom: 'misterioso' },
        jogadores: [{ nome: 'Aria', classe: 'Ladina', descricaoFisica: 'ágil, capuz verde, olhar desconfiado' }],
        numLocais: 4,
      });
      console.log(JSON.stringify(mundo, null, 2));
    }
  } catch (e) {
    console.error('FALHOU:', e.codigo || e.name, '-', e.message, e.retryAfterSeg ? `(tente em ${e.retryAfterSeg}s)` : '');
    process.exit(1);
  }
})();
