const { RegraInvalidaError, ATRIBUTOS, modificadorAtributo } = require('./gameRules');

// Vida base por classe (o servidor decide; o cliente nunca envia vida).
const CLASSES = Object.freeze({
  guerreiro: 28,
  mago: 16,
  ladino: 20,
  clerigo: 22,
  arqueiro: 20,
  bardo: 18,
});

const ATRIBUTO_MIN = 8;
const ATRIBUTO_MAX = 16;
const PONTOS_TOTAIS = 48; // média 12 nos 4 atributos
const DESC_MIN = 20;
const DESC_MAX = 600;

const semAcento = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function texto(valor, campo, min, max) {
  const t = typeof valor === 'string' ? valor.replace(/\s+/g, ' ').trim() : '';
  if (t.length < min || t.length > max) {
    throw new RegraInvalidaError(`${campo} deve ter entre ${min} e ${max} caracteres.`);
  }
  return t;
}

/** Valida o corpo do formulário e devolve os campos prontos para gravar. */
function validarFicha(body = {}) {
  const nome = texto(body.nome, 'O nome', 2, 60);
  const classeChave = semAcento(texto(body.classe, 'A classe', 2, 30));
  if (!(classeChave in CLASSES)) {
    throw new RegraInvalidaError(`Classe inválida. Use: ${Object.keys(CLASSES).join(', ')}.`);
  }
  const descricaoFisica = texto(body.descricaoFisica, 'A descrição física', DESC_MIN, DESC_MAX);

  const atributos = {};
  let soma = 0;
  for (const a of ATRIBUTOS) {
    const v = body[a];
    if (!Number.isInteger(v) || v < ATRIBUTO_MIN || v > ATRIBUTO_MAX) {
      throw new RegraInvalidaError(`${a} deve ser um inteiro entre ${ATRIBUTO_MIN} e ${ATRIBUTO_MAX}.`);
    }
    atributos[a] = v;
    soma += v;
  }
  if (soma > PONTOS_TOTAIS) {
    throw new RegraInvalidaError(`A soma dos atributos (${soma}) excede o limite de ${PONTOS_TOTAIS} pontos.`);
  }

  const vidaMax = CLASSES[classeChave] + Math.max(0, modificadorAtributo(atributos.forca)) * 2;
  return { nome, classe: classeChave, descricaoFisica, ...atributos, vidaMax, vidaAtual: vidaMax };
}

module.exports = { CLASSES, ATRIBUTO_MIN, ATRIBUTO_MAX, PONTOS_TOTAIS, DESC_MIN, DESC_MAX, validarFicha };
