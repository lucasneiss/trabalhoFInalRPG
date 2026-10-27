const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('Personagem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nome: { type: DataTypes.TEXT, allowNull: false },
  classe: { type: DataTypes.TEXT, allowNull: false },
  forca: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
  destreza: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
  inteligencia: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
  carisma: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
  vidaMax: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 20, field: 'vida_max' },
  vidaAtual: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 20, field: 'vida_atual' },
  inventario: {
    type: DataTypes.TEXT, allowNull: false, defaultValue: '[]',
    get() { return JSON.parse(this.getDataValue('inventario') || '[]'); },
    set(v) { this.setDataValue('inventario', JSON.stringify(v || [])); },
  },
  descricaoFisica: { type: DataTypes.TEXT, allowNull: false, field: 'descricao_fisica' },
  avatarPath: { type: DataTypes.TEXT, field: 'avatar_path' },
  criadoEm: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'criado_em' },
}, { tableName: 'personagens' });
