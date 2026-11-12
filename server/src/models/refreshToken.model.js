import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

// Only a SHA-256 hash of the refresh token is stored. Logout revokes the row.
const RefreshToken = sequelize.define(
  'RefreshToken',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    tokenHash: { type: DataTypes.CHAR(64), allowNull: false, unique: true },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    revokedAt: { type: DataTypes.DATE, allowNull: true },
    userAgent: { type: DataTypes.STRING(255), allowNull: true },
    ip: { type: DataTypes.STRING(64), allowNull: true },
  },
  {
    tableName: 'refresh_tokens',
    underscored: true,
    indexes: [{ fields: ['user_id'] }, { fields: ['expires_at'] }],
  }
);

export default RefreshToken;