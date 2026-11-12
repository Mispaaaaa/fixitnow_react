import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import { softDeleteAttribute } from './helpers.js';

export const Conversation = sequelize.define(
  'Conversation',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    // The same request always maps to exactly one conversation. Consultation
    // conversations started from a technician profile have no request.
    requestId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, unique: true },
    customerId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    technicianId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    lastMessageAt: { type: DataTypes.DATE, allowNull: true },
    ...softDeleteAttribute,
  },
  {
    tableName: 'conversations',
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['customer_id'] },
      { fields: ['technician_id'] },
      { fields: ['last_message_at'] },
    ],
  }
);

export const Message = sequelize.define(
  'Message',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    conversationId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    senderId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    type: {
      type: DataTypes.ENUM('text', 'image', 'location'),
      allowNull: false,
      defaultValue: 'text',
    },
    body: { type: DataTypes.TEXT, allowNull: true },
    imageUrl: { type: DataTypes.STRING(500), allowNull: true },
    locationShareId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    deliveredAt: { type: DataTypes.DATE, allowNull: true },
    seenAt: { type: DataTypes.DATE, allowNull: true },
    ...softDeleteAttribute,
  },
  {
    tableName: 'messages',
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['conversation_id', 'created_at'] },
      { fields: ['sender_id'] },
      { fields: ['seen_at'] },
    ],
  }
);

export const LocationShare = sequelize.define(
  'LocationShare',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    conversationId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    requestId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    lat: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
    lng: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
    mode: { type: DataTypes.ENUM('snapshot', 'live'), allowNull: false, defaultValue: 'snapshot' },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    stoppedAt: { type: DataTypes.DATE, allowNull: true },
    // Location rows are the single hard-delete exception (privacy purge).
  },
  {
    tableName: 'location_shares',
    underscored: true,
    indexes: [
      { fields: ['conversation_id'] },
      { fields: ['request_id'] },
      { fields: ['expires_at'] },
      { fields: ['stopped_at'] },
    ],
  }
);