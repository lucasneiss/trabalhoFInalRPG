const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('MapaCenario', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ordem: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  nome: { type: DataTypes.TEXT, allowNull: false },
  descricao: { type: DataTypes.TEXT, allowNull: false },
  promptImagem: { type: DataTypes.TEXT, field: 'prompt_imagem' },
  imagemPath: { type: DataTypes.TEXT, field: 'imagem_path' },
  visitado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  criadoEm: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'criado_em' },
}, { tableName: 'mapas_cenarios' });
