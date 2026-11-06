const API = '/api';
let state = { user: null, characters: [], currentChar: null, screen: 'auth' };
window.__classes = [];

function render() {
  const app = document.getElementById('app');
  app.innerHTML = state.screen === 'auth' ? renderAuth() : renderGame();
}

function renderAuth() {
  const [tab, setTab] = window.__currentTab || ['login', () => {}];
  return `
    <div class="auth-container">
      <h1>RPG Multiplayer</h1>
      <div class="auth-tabs">
        <button class="${tab === 'login' ? 'active' : ''}" onclick="switchTab('login')">Login</button>
        <button class="${tab === 'register' ? 'active' : ''}" onclick="switchTab('register')">Cadastro</button>
      </div>

      <div class="auth-form">
        ${tab === 'login' ? `
          <div class="form-group">
            <label>E-mail:</label>
            <input type="email" id="login-email" placeholder="seu@email.com">
          </div>
          <div class="form-group">
            <label>Senha:</label>
            <input type="password" id="login-password">
          </div>
          <button onclick="login()">Entrar</button>
          <div class="error" id="auth-error"></div>
        ` : `
          <div class="form-group">
            <label>Nome:</label>
            <input type="text" id="register-name" placeholder="Seu nome">
          </div>
          <div class="form-group">
            <label>E-mail:</label>
            <input type="email" id="register-email" placeholder="seu@email.com">
          </div>
          <div class="form-group">
            <label>Senha:</label>
            <input type="password" id="register-password">
          </div>
          <button onclick="register()">Cadastrar</button>
          <div class="error" id="auth-error"></div>
        `}
      </div>
    </div>
  `;
}

function renderGame() {
  const classOptions = window.__classes ? window.__classes.map(c => `<option value="${c}">${c.charAt(0).toUpperCase() + c.slice(1)}</option>`).join('') : '';

  return `
    <div class="container">
      <div class="header">
        <h1>RPG Multiplayer</h1>
        <div class="user-info">
          <span>${state.user?.nome}</span>
          <button onclick="logout()" style="margin-left: 1rem;">Sair</button>
        </div>
      </div>

      <div class="game-container">
        <div class="game-panel">
          <h2>Personagens</h2>
          <div class="char-list" id="char-list">
            ${state.characters.map((p, i) => `
              <div class="char-item ${state.currentChar?.id === p.id ? 'active' : ''}" onclick="selectChar(${i})">
                <strong>${p.nome}</strong>
                <div class="char-stats">${p.classe} | HP ${p.vidaAtual}/${p.vidaMax}</div>
              </div>
            `).join('')}
          </div>

          <div style="margin-top: 2rem;">
            <h3>Novo Personagem</h3>
            <form class="create-char-form" onsubmit="createChar(event)">
              <div class="form-group">
                <label>Nome:</label>
                <input type="text" id="char-name" required>
              </div>
              <div class="form-group">
                <label>Classe:</label>
                <select id="char-class" required>
                  <option value="">Escolha uma classe...</option>
                  ${classOptions}
                </select>
              </div>
              <div class="form-group">
                <label>Descrição Física:</label>
                <textarea id="char-desc" required style="height: 80px;"></textarea>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Força:</label>
                  <input type="number" id="char-forca" min="8" max="15" value="10" required>
                </div>
                <div class="form-group">
                  <label>Destreza:</label>
                  <input type="number" id="char-destreza" min="8" max="15" value="10" required>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Inteligência:</label>
                  <input type="number" id="char-inteligencia" min="8" max="15" value="10" required>
                </div>
                <div class="form-group">
                  <label>Carisma:</label>
                  <input type="number" id="char-carisma" min="8" max="15" value="10" required>
                </div>
              </div>
              <button type="submit">Criar Personagem</button>
              <div id="create-error"></div>
            </form>
          </div>
        </div>

        <div class="game-panel">
          <h2>Cenário</h2>
          <div id="map-container" class="loading">Selecione um personagem</div>
        </div>

        <div class="game-panel">
          <h2>Detalhes</h2>
          <div id="details-container" class="loading">Aguardando seleção...</div>
        </div>
      </div>
    </div>
  `;
}

function switchTab(tab) {
  window.__currentTab = [tab];
  render();
}

async function login() {
  const email = document.getElementById('login-email').value;
  const senha = document.getElementById('login-password').value;
  const error = document.getElementById('auth-error');

  if (!email || !senha) {
    error.textContent = 'Preencha todos os campos.';
    return;
  }

  try {
    const r = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, senha }) });
    if (!r.ok) throw new Error((await r.json()).erro);
    const data = await r.json();
    state.user = data.usuario;
    state.screen = 'game';
    await loadClasses();
    await loadCharacters();
    render();
  } catch (e) {
    document.getElementById('auth-error').textContent = e.message;
  }
}

async function register() {
  const nome = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const senha = document.getElementById('register-password').value;
  const error = document.getElementById('auth-error');

  if (!nome || !email || !senha) {
    error.textContent = 'Preencha todos os campos.';
    return;
  }

  try {
    const r = await fetch(`${API}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome, email, senha }) });
    if (!r.ok) throw new Error((await r.json()).erro);
    const data = await r.json();
    state.user = data.usuario;
    state.screen = 'game';
    await loadClasses();
    await loadCharacters();
    render();
  } catch (e) {
    document.getElementById('auth-error').textContent = e.message;
  }
}

async function logout() {
  await fetch(`${API}/auth/logout`, { method: 'POST' });
  state.user = null;
  state.characters = [];
  state.currentChar = null;
  state.screen = 'auth';
  window.__currentTab = ['login'];
  render();
}

async function loadClasses() {
  const r = await fetch(`${API}/characters/rules`);
  const data = await r.json();
  window.__classes = data.classes;
}

async function loadCharacters() {
  const r = await fetch(`${API}/characters`);
  const data = await r.json();
  state.characters = data.personagens;
  render();
}

async function createChar(e) {
  e.preventDefault();
  const data = {
    nome: document.getElementById('char-name').value,
    classe: document.getElementById('char-class').value,
    descricaoFisica: document.getElementById('char-desc').value,
    forca: Number(document.getElementById('char-forca').value),
    destreza: Number(document.getElementById('char-destreza').value),
    inteligencia: Number(document.getElementById('char-inteligencia').value),
    carisma: Number(document.getElementById('char-carisma').value),
  };

  try {
    const r = await fetch(`${API}/characters`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!r.ok) throw new Error((await r.json()).erro);
    await loadCharacters();
    document.getElementById('char-name').value = '';
    document.getElementById('char-desc').value = '';
  } catch (e) {
    document.getElementById('create-error').textContent = e.message;
  }
}

function selectChar(idx) {
  state.currentChar = state.characters[idx];
  const p = state.currentChar;
  document.getElementById('map-container').innerHTML = '<p style="color: #aaa;">Aguardando mapa (Integrante 5/6)</p>';
  document.getElementById('details-container').innerHTML = `
    <img src="${p.avatarUrl || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22150%22%3E%3Crect fill=%22%23444%22 width=%22150%22 height=%22150%22/%3E%3C/svg%3E'}" alt="Avatar" class="avatar">
    <h3>${p.nome}</h3>
    <p><strong>Classe:</strong> ${p.classe}</p>
    <p><strong>HP:</strong> ${p.vidaAtual}/${p.vidaMax}</p>
    <div style="margin-top: 1rem;">
      <div class="stat-row"><span>Força:</span> <strong>${p.forca}</strong></div>
      <div class="stat-row"><span>Destreza:</span> <strong>${p.destreza}</strong></div>
      <div class="stat-row"><span>Inteligência:</span> <strong>${p.inteligencia}</strong></div>
      <div class="stat-row"><span>Carisma:</span> <strong>${p.carisma}</strong></div>
    </div>
  `;
  render();
}

async function init() {
  try {
    const r = await fetch(`${API}/auth/me`);
    if (r.ok) {
      state.user = (await r.json()).usuario;
      state.screen = 'game';
      await loadClasses();
      await loadCharacters();
    }
  } catch {}
  render();
}

window.__currentTab = ['login'];
init();
