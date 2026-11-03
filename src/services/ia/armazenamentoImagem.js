const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RAIZ = () => path.resolve(process.env.UPLOADS_DIR || './uploads');
const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
const MAX_BYTES = 8 * 1024 * 1024;

const PASTAS = Object.freeze({ avatar: 'avatars', mapa: 'mapas' });

/** Salva o buffer em uploads/<pasta>/<nome-aleatório>.<ext> e devolve a URL pública (ex.: /uploads/avatars/ab12.png). */
async function salvarImagem({ buffer, mimeType }, tipo) {
  const pasta = PASTAS[tipo];
  if (!pasta) throw new Error('Tipo de imagem inválido.');
  const ext = EXT[mimeType];
  if (!ext) throw new Error(`Formato de imagem não suportado: ${mimeType}`);
  if (!buffer || buffer.length === 0 || buffer.length > MAX_BYTES) throw new Error('Imagem vazia ou grande demais.');

  const dir = path.join(RAIZ(), pasta);
  await fs.promises.mkdir(dir, { recursive: true });
  const nome = `${crypto.randomUUID()}.${ext}`; // nome não adivinhável e nunca vindo do cliente
  await fs.promises.writeFile(path.join(dir, nome), buffer);
  return `/uploads/${pasta}/${nome}`;
}

/** Apaga a imagem antiga ao regenerar (só aceita caminhos dentro de /uploads/). */
async function removerImagem(urlPath) {
  if (typeof urlPath !== 'string' || !urlPath.startsWith('/uploads/')) return;
  const alvo = path.resolve(RAIZ(), urlPath.slice('/uploads/'.length));
  if (!alvo.startsWith(RAIZ() + path.sep)) return;
  await fs.promises.unlink(alvo).catch(() => {});
}

module.exports = { salvarImagem, removerImagem, RAIZ };
