const { gerarImagem } = require('./imagem');
const { montarPromptRetrato, montarPromptCenario } = require('./estiloImagem');
const { salvarImagem, removerImagem } = require('./armazenamentoImagem');

// Evita duas gerações simultâneas (e cobrança dupla) para o mesmo registro.
const emAndamento = new Set();
async function comTrava(chave, fn) {
  if (emAndamento.has(chave)) {
    const e = new Error('Já existe uma geração de imagem em andamento para este item.');
    e.status = 409;
    throw e;
  }
  emAndamento.add(chave);
  try { return await fn(); } finally { emAndamento.delete(chave); }
}

/** Gera o retrato, salva o arquivo e vincula à ficha (personagem.avatarPath). */
function gerarAvatarDoPersonagem(personagem, opcoes = {}) {
  return comTrava(`p:${personagem.id}`, async () => {
    const prompt = montarPromptRetrato({ nome: personagem.nome, classe: personagem.classe, descricaoFisica: personagem.descricaoFisica });
    const imagem = await gerarImagem(prompt, opcoes);
    const novo = await salvarImagem(imagem, 'avatar');
    const antigo = personagem.avatarPath;
    personagem.avatarPath = novo;
    try { await personagem.save(); } catch (e) { await removerImagem(novo); throw e; }
    await removerImagem(antigo);
    return novo;
  });
}

/** Gera a imagem do mapa a partir do prompt devolvido pelo Gemini (mapa.promptImagem). */
function gerarImagemDoMapa(mapa, opcoes = {}) {
  return comTrava(`m:${mapa.id}`, async () => {
    const prompt = montarPromptCenario({ nome: mapa.nome, promptImagem: mapa.promptImagem, descricao: mapa.descricao });
    const imagem = await gerarImagem(prompt, opcoes);
    const novo = await salvarImagem(imagem, 'mapa');
    const antigo = mapa.imagemPath;
    mapa.imagemPath = novo;
    try { await mapa.save(); } catch (e) { await removerImagem(novo); throw e; }
    await removerImagem(antigo);
    return novo;
  });
}

module.exports = { gerarAvatarDoPersonagem, gerarImagemDoMapa };
