const sequelize = require('../config/database');
const Usuario = require('./Usuario');
const Sala = require('./Sala');
const MapaCenario = require('./MapaCenario');
const Personagem = require('./Personagem');
const Mensagem = require('./Mensagem');

// Usuário 1:N Personagens
Usuario.hasMany(Personagem, { foreignKey: 'usuario_id', onDelete: 'CASCADE' });
Personagem.belongsTo(Usuario, { foreignKey: 'usuario_id' });

// Usuário (host) 1:N Salas
Usuario.hasMany(Sala, { foreignKey: 'host_id', as: 'salasCriadas', onDelete: 'CASCADE' });
Sala.belongsTo(Usuario, { foreignKey: 'host_id', as: 'host' });

// Sala 1:N Personagens
Sala.hasMany(Personagem, { foreignKey: 'sala_id', onDelete: 'SET NULL' });
Personagem.belongsTo(Sala, { foreignKey: 'sala_id' });

// Sala 1:N Mapas
Sala.hasMany(MapaCenario, { foreignKey: 'sala_id', onDelete: 'CASCADE' });
MapaCenario.belongsTo(Sala, { foreignKey: 'sala_id' });

// Sala -> mapa atual
Sala.belongsTo(MapaCenario, { foreignKey: 'mapa_atual_id', as: 'mapaAtual', constraints: false });

// Sala 1:N Mensagens; Personagem 1:N Mensagens
Sala.hasMany(Mensagem, { foreignKey: 'sala_id', onDelete: 'CASCADE' });
Mensagem.belongsTo(Sala, { foreignKey: 'sala_id' });
Personagem.hasMany(Mensagem, { foreignKey: 'personagem_id', onDelete: 'SET NULL' });
Mensagem.belongsTo(Personagem, { foreignKey: 'personagem_id' });

module.exports = { sequelize, Usuario, Sala, MapaCenario, Personagem, Mensagem };
