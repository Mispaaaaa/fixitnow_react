import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import { jsonAttr, softDeleteAttribute } from './helpers.js';

export const Notification = sequelize.define(
  'Notification',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    type: { type: DataTypes.STRING(60), allowNull: false },
    title: { type: DataTypes.STRING(180), allowNull: false },
    body: { type: DataTypes.STRING(600), allowNull: true },
    data: jsonAttr('data', {}),
    readAt: { type: DataTypes.DATE, allowNull: true },
    ...softDeleteAttribute,
  },
  {
    tableName: 'notifications',
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['user_id', 'read_at'] },
      { fields: ['created_at'] },
    ],
  }
);

export const PushSubscription = sequelize.define(
  'PushSubscription',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    endpoint: { type: DataTypes.STRING(500), allowNull: false, unique: true },
    p256dh: { type: DataTypes.STRING(255), allowNull: false },
    auth: { type: DataTypes.STRING(255), allowNull: false },
    userAgent: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    tableName: 'push_subscriptions',
    underscored: true,
    indexes: [{ fields: ['user_id'] }],
  }
);