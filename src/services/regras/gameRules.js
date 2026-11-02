const crypto = require('crypto');

const ATRIBUTOS = Object.freeze(['forca', 'destreza', 'inteligencia', 'carisma']);
const MAX_VIDA = 100000;
const MAX_QUANTIDADE = 999;

class RegraInvalidaError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RegraInvalidaError';
    this.status = 400;
  }
}

function inteiroNoIntervalo(valor, nome, min, max) {
  if (!Number.isInteger(valor) || valor < min || valor > max) {
    throw new RegraInvalidaError(`${nome} deve ser um número inteiro entre ${min} e ${max}.`);
  }
  return valor;
}

function validarAtributo(atributo) {
  if (!ATRIBUTOS.includes(atributo)) {
    throw new RegraInvalidaError(`Atributo inválido. Use: ${ATRIBUTOS.join(', ')}.`);
  }
  return atributo;
}

function modificadorAtributo(valor) {
  inteiroNoIntervalo(valor, 'Atributo', 1, 30);
  return Math.floor((valor - 10) / 2);
}

function rolarD20() {
  return crypto.randomInt(1, 21);
}

/** O servidor escolhe a rolagem; o cliente nunca envia o resultado do dado. */
function testePericia({ personagem, atributo, dificuldade }) {
  validarAtributo(atributo);
  inteiroNoIntervalo(dificuldade, 'Dificuldade', 1, 30);

  const valorAtributo = personagem[atributo];
  const modificador = modificadorAtributo(valorAtributo);
  const dado = rolarD20();
  const total = dado + modificador;
  const sucesso = dado === 20 || (dado !== 1 && total >= dificuldade);

  return {
    tipo: 'teste_pericia',
    atributo,
    valorAtributo,
    modificador,
    dado,
    dificuldade,
    total,
    sucesso,
    critico: dado === 20,
    falhaCritica: dado === 1,
  };
}

function aplicarDano(personagem, quantidade) {
  inteiroNoIntervalo(quantidade, 'Dano', 1, MAX_VIDA);
  const vidaAnterior = personagem.vidaAtual;
  const vidaAtual = Math.max(0, vidaAnterior - quantidade);
  personagem.vidaAtual = vidaAtual;
  return { tipo: 'receber_dano', quantidade, vidaAnterior, vidaAtual, danoAplicado: vidaAnterior - vidaAtual, derrotado: vidaAtual === 0 };
}

function curar(personagem, quantidade) {
  inteiroNoIntervalo(quantidade, 'Cura', 1, MAX_VIDA);
  const vidaAnterior = personagem.vidaAtual;
  const vidaAtual = Math.min(personagem.vidaMax, vidaAnterior + quantidade);
  personagem.vidaAtual = vidaAtual;
  return { tipo: 'curar', quantidade, vidaAnterior, vidaAtual, curaAplicada: vidaAtual - vidaAnterior };
}

function validarInventario(inventario) {
  if (!Array.isArray(inventario)) throw new RegraInvalidaError('Inventário inválido.');
  return inventario.map((item) => {
    if (!item || typeof item.nome !== 'string' || !item.nome.trim() || item.nome.trim().length > 80) {
      throw new RegraInvalidaError('Cada item precisa ter um nome entre 1 e 80 caracteres.');
    }
    inteiroNoIntervalo(item.quantidade, 'Quantidade do item', 1, MAX_QUANTIDADE);
    return { nome: item.nome.trim(), quantidade: item.quantidade };
  });
}

function adicionarItem(personagem, nome, quantidade = 1) {
  if (typeof nome !== 'string' || !nome.trim() || nome.trim().length > 80) {
    throw new RegraInvalidaError('Nome do item inválido.');
  }
  inteiroNoIntervalo(quantidade, 'Quantidade', 1, MAX_QUANTIDADE);
  const inventario = validarInventario(personagem.inventario || []);
  const nomeLimpo = nome.trim();
  const existente = inventario.find((item) => item.nome.toLocaleLowerCase('pt-BR') === nomeLimpo.toLocaleLowerCase('pt-BR'));
  if (existente) {
    inteiroNoIntervalo(existente.quantidade + quantidade, 'Quantidade total', 1, MAX_QUANTIDADE);
    existente.quantidade += quantidade;
  } else {
    inventario.push({ nome: nomeLimpo, quantidade });
  }
  personagem.inventario = inventario;
  return { tipo: 'adicionar_item', item: nomeLimpo, quantidade, inventario };
}

function removerItem(personagem, nome, quantidade = 1) {
  if (typeof nome !== 'string' || !nome.trim()) throw new RegraInvalidaError('Nome do item inválido.');
  inteiroNoIntervalo(quantidade, 'Quantidade', 1, MAX_QUANTIDADE);
  const inventario = validarInventario(personagem.inventario || []);
  const indice = inventario.findIndex((item) => item.nome.toLocaleLowerCase('pt-BR') === nome.trim().toLocaleLowerCase('pt-BR'));
  if (indice < 0 || inventario[indice].quantidade < quantidade) {
    throw new RegraInvalidaError('O personagem não possui essa quantidade do item.');
  }
  inventario[indice].quantidade -= quantidade;
  if (inventario[indice].quantidade === 0) inventario.splice(indice, 1);
  personagem.inventario = inventario;
  return { tipo: 'remover_item', item: nome.trim(), quantidade, inventario };
}

module.exports = {
  ATRIBUTOS,
  RegraInvalidaError,
  modificadorAtributo,
  rolarD20,
  testePericia,
  aplicarDano,
  curar,
  adicionarItem,
  removerItem,
};
