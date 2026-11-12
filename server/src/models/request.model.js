import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import { REQUEST_STATUSES, TIME_SLOTS, URGENCIES } from '../utils/constants.js';
import { jsonAttr, softDeleteAttribute } from './helpers.js';

export const ServiceRequest = sequelize.define(
  'ServiceRequest',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    customerId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    technicianId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    categoryId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    applianceBrand: { type: DataTypes.STRING(120), allowNull: true },
    applianceModel: { type: DataTypes.STRING(120), allowNull: true },
    issueDescription: { type: DataTypes.TEXT, allowNull: false },
    urgency: { type: DataTypes.ENUM(...URGENCIES), allowNull: false, defaultValue: 'normal' },
    preferredDate: { type: DataTypes.DATEONLY, allowNull: false },
    timeSlot: { type: DataTypes.ENUM(...TIME_SLOTS), allowNull: false },
    address: { type: DataTypes.STRING(500), allowNull: false },
    city: { type: DataTypes.STRING(120), allowNull: false },
    lat: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
    lng: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
    status: {
      type: DataTypes.ENUM(...REQUEST_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    },
    diagnosisNotes: { type: DataTypes.TEXT, allowNull: true },
    partsUsed: jsonAttr('partsUsed', []),
    finalCost: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    cancellationReason: { type: DataTypes.STRING(500), allowNull: true },
    cancelledBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    acceptedAt: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    reminderSentAt: { type: DataTypes.DATE, allowNull: true },
    ...softDeleteAttribute,
  },
  {
    tableName: 'service_requests',
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['customer_id'] },
      { fields: ['technician_id'] },
      { fields: ['category_id'] },
      { fields: ['status'] },
      { fields: ['preferred_date'] },
      { fields: ['city'] },
      { fields: ['lat', 'lng'] },
      { fields: ['status', 'preferred_date'] },
    ],
  }
);

export const RequestPhoto = sequelize.define(
  'RequestPhoto',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    requestId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    filePath: { type: DataTypes.STRING(500), allowNull: false },
    originalName: { type: DataTypes.STRING(255), allowNull: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    ...softDeleteAttribute,
  },
  {
    tableName: 'request_photos',
    underscored: true,
    paranoid: true,
    indexes: [{ fields: ['request_id'] }],
  }
);

export const RequestStatusHistory = sequelize.define(
  'RequestStatusHistory',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    requestId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    status: { type: DataTypes.ENUM(...REQUEST_STATUSES), allowNull: false },
    note: { type: DataTypes.STRING(500), allowNull: true },
    changedBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    ...softDeleteAttribute,
  },
  {
    tableName: 'request_status_history',
    underscored: true,
    paranoid: true,
    indexes: [{ fields: ['request_id'] }, { fields: ['status'] }],
  }
);