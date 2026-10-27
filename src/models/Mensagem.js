const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('Mensagem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tipo: {
    type: DataTypes.TEXT, allowNull: false, defaultValue: 'jogador',
    validate: { isIn: [['jogador', 'mestre', 'npc', 'sistema']] },
  },
  autorNome: { type: DataTypes.TEXT, allowNull: false, field: 'autor_nome' },
  conteudo: { type: DataTypes.TEXT, allowNull: false },
  criadoEm: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'criado_em' },
}, { tableName: 'mensagens' });
