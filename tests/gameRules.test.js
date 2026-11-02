const test = require('node:test');
const assert = require('node:assert/strict');
const regras = require('../src/services/regras/gameRules');

test('modificador D20 segue a escala de atributos', () => {
  assert.equal(regras.modificadorAtributo(10), 0);
  assert.equal(regras.modificadorAtributo(14), 2);
  assert.equal(regras.modificadorAtributo(8), -1);
});

test('dano não reduz vida abaixo de zero', () => {
  const personagem = { vidaAtual: 5 };
  const resultado = regras.aplicarDano(personagem, 9);
  assert.equal(personagem.vidaAtual, 0);
  assert.equal(resultado.danoAplicado, 5);
  assert.equal(resultado.derrotado, true);
});

test('cura não ultrapassa vida máxima', () => {
  const personagem = { vidaAtual: 18, vidaMax: 20 };
  const resultado = regras.curar(personagem, 10);
  assert.equal(personagem.vidaAtual, 20);
  assert.equal(resultado.curaAplicada, 2);
});

test('adiciona e remove itens acumulando quantidades', () => {
  const personagem = { inventario: [{ nome: 'Poção', quantidade: 1 }] };
  regras.adicionarItem(personagem, 'poção', 2);
  assert.equal(personagem.inventario[0].quantidade, 3);
  regras.removerItem(personagem, 'POÇÃO', 2);
  assert.equal(personagem.inventario[0].quantidade, 1);
});

test('rejeita atributos não permitidos e quantidade inválida', () => {
  assert.throws(() => regras.modificadorAtributo(0), regras.RegraInvalidaError);
  assert.throws(() => regras.adicionarItem({ inventario: [] }, 'Chave', 0), regras.RegraInvalidaError);
});
