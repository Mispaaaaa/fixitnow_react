import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import { ROLES } from '../utils/constants.js';
import { softDeleteAttribute } from './helpers.js';

const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(190), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(100), allowNull: false },
    phone: { type: DataTypes.STRING(30), allowNull: true },
    avatarUrl: { type: DataTypes.STRING(500), allowNull: true },
    role: { type: DataTypes.ENUM(...ROLES), allowNull: false, defaultValue: 'customer' },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    pushEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    lastActiveAt: { type: DataTypes.DATE, allowNull: true },
    ...softDeleteAttribute,
  },
  {
    tableName: 'users',
    underscored: true,
    paranoid: true,
    indexes: [{ fields: ['role'] }, { fields: ['is_active'] }],
  }
);

User.prototype.toJSON = function toJSON() {
  const values = { ...this.get() };
  delete values.passwordHash;
  return values;
};

export default User;