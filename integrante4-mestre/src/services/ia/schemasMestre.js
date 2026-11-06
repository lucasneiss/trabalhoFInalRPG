// Schemas de saída estruturada + validação defensiva das respostas do Mestre.
const { Type } = require('@google/genai');

// Só os atributos que existem na ficha (models/Personagem.js).
const PERICIAS = ['forca', 'destreza', 'inteligencia', 'carisma'];

const schemaMundo = {
  type: Type.OBJECT,
  properties: {
    preludio: { type: Type.STRING },
    objetivoPrincipal: { type: Type.STRING },
    locais: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          nome: { type: Type.STRING },
          descricao: { type: Type.STRING },
          promptImagem: { type: Type.STRING },
          saidas: { type: Type.ARRAY, items: { type: Type.INTEGER } },
          npcs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { nome: { type: Type.STRING }, papel: { type: Type.STRING }, personalidade: { type: Type.STRING } },
              required: ['nome', 'papel', 'personalidade'],
            },
          },
          desafio: {
            type: Type.OBJECT,
            nullable: true,
            properties: {
              descricao: { type: Type.STRING },
              pericia: { type: Type.STRING, enum: PERICIAS },
              dificuldade: { type: Type.INTEGER },
            },
            required: ['descricao', 'pericia', 'dificuldade'],
          },
        },
        required: ['id', 'nome', 'descricao', 'promptImagem', 'saidas', 'npcs'],
      },
    },
  },
  required: ['preludio', 'objetivoPrincipal', 'locais'],
};

const schemaDesfecho = {
  type: Type.OBJECT,
  properties: {
    narracao: { type: Type.STRING },
    falasNpc: {
      type: Type.ARRAY,
      items: { type: Type.OBJECT, properties: { npc: { type: Type.STRING }, fala: { type: Type.STRING } }, required: ['npc', 'fala'] },
    },
    gancho: { type: Type.STRING },
  },
  required: ['narracao', 'gancho'],
};

function validarMundo(m) {
  const erros = [];
  if (!m || typeof m !== 'object') return ['resposta vazia'];
  if (!m.preludio) erros.push('sem preludio');
  if (!m.objetivoPrincipal) erros.push('sem objetivoPrincipal');
  if (!Array.isArray(m.locais) || m.locais.length < 2) { erros.push('locais insuficientes'); return erros; }
  const ids = new Set(m.locais.map((l) => l.id));
  if (ids.size !== m.locais.length) erros.push('ids de locais duplicados');
  for (const l of m.locais) {
    if (!l.nome || !l.descricao || !l.promptImagem) erros.push(`local ${l.id}: campos obrigatórios ausentes`);
    for (const s of l.saidas || []) if (!ids.has(s)) erros.push(`local ${l.id}: saída ${s} inexistente`);
    if (l.desafio && !PERICIAS.includes(l.desafio.pericia)) erros.push(`local ${l.id}: perícia inválida`);
  }
  return erros;
}

const validarDesfecho = (d) =>
  (d && typeof d.narracao === 'string' && d.narracao.trim() && typeof d.gancho === 'string' ? [] : ['desfecho inválido']);

module.exports = { schemaMundo, schemaDesfecho, validarMundo, validarDesfecho, PERICIAS };
