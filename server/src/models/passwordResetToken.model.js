import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const PasswordResetToken = sequelize.define(
  'PasswordResetToken',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    tokenHash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    usedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'password_reset_tokens',
    underscored: true,
    indexes: [{ fields: ['user_id'] }, { fields: ['expires_at'] }],
  }
);

export default PasswordResetToken;
