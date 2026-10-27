require('dotenv').config();
const path = require('path');
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.resolve(process.env.DB_STORAGE || './database/rpg.sqlite'),
  logging: false,
  define: { underscored: true, timestamps: false },
});

module.exports = sequelize;
