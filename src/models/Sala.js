const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('Sala', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  codigo: { type: DataTypes.TEXT, allowNull: false, unique: true },
  nome: { type: DataTypes.TEXT, allowNull: false },
  tema: { type: DataTypes.TEXT, allowNull: false },
  lore: DataTypes.TEXT,
  objetivo: DataTypes.TEXT,
  status: {
    type: DataTypes.TEXT, allowNull: false, defaultValue: 'aguardando',
    validate: { isIn: [['aguardando', 'em_andamento', 'encerrada']] },
  },
  criadoEm: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'criado_em' },
}, { tableName: 'salas' });
