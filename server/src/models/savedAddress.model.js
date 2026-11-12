import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import { softDeleteAttribute } from './helpers.js';

const SavedAddress = sequelize.define(
  'SavedAddress',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    label: { type: DataTypes.STRING(80), allowNull: false },
    address: { type: DataTypes.STRING(500), allowNull: false },
    city: { type: DataTypes.STRING(120), allowNull: false },
    lat: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
    lng: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
    isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    ...softDeleteAttribute,
  },
  {
    tableName: 'saved_addresses',
    underscored: true,
    paranoid: true,
    indexes: [{ fields: ['user_id'] }, { fields: ['lat', 'lng'] }],
  }
);

export default SavedAddress;