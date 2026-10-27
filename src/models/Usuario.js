const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('Usuario', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nome: { type: DataTypes.TEXT, allowNull: false },
  email: { type: DataTypes.TEXT, allowNull: false, unique: true },
  senhaHash: { type: DataTypes.TEXT, allowNull: false, field: 'senha_hash' },
  criadoEm: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'criado_em' },
}, { tableName: 'usuarios' });
