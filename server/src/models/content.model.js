import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import { ANNOUNCEMENT_STYLES } from '../utils/constants.js';
import { jsonAttr, softDeleteAttribute } from './helpers.js';

export const Announcement = sequelize.define(
  'Announcement',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    role: {
      type: DataTypes.ENUM('customer', 'technician', 'all'),
      allowNull: false,
      defaultValue: 'all',
    },
    title: { type: DataTypes.STRING(180), allowNull: false },
    text: { type: DataTypes.TEXT, allowNull: false },
    style: { type: DataTypes.ENUM(...ANNOUNCEMENT_STYLES), allowNull: false, defaultValue: 'info' },
    startsAt: { type: DataTypes.DATE, allowNull: true },
    endsAt: { type: DataTypes.DATE, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    sentNotification: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    createdBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    ...softDeleteAttribute,
  },
  {
    tableName: 'announcements',
    underscored: true,
    paranoid: true,
    indexes: [{ fields: ['role'] }, { fields: ['is_active'] }, { fields: ['starts_at', 'ends_at'] }],
  }
);

export const SiteContent = sequelize.define(
  'SiteContent',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    key: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    // Display-only content: sections, text, image URLs and ordering.
    blocks: jsonAttr('blocks', null),
    updatedBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    ...softDeleteAttribute,
  },
  {
    tableName: 'site_content',
    underscored: true,
    paranoid: true,
    indexes: [{ fields: ['key'] }],
  }
);

export const AuditLog = sequelize.define(
  'AuditLog',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    actorId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    action: { type: DataTypes.STRING(120), allowNull: false },
    entityType: { type: DataTypes.STRING(60), allowNull: false },
    entityId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    before: jsonAttr('before', null),
    after: jsonAttr('after', null),
    ip: { type: DataTypes.STRING(64), allowNull: true },
  },
  {
    tableName: 'audit_logs',
    underscored: true,
    indexes: [
      { fields: ['actor_id'] },
      { fields: ['entity_type', 'entity_id'] },
      { fields: ['created_at'] },
    ],
  }
);