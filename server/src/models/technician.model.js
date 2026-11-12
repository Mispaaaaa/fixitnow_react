import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import { DOCUMENT_TYPES, VERIFICATION_STATUSES } from '../utils/constants.js';
import { jsonAttr, softDeleteAttribute } from './helpers.js';

export const TechnicianProfile = sequelize.define(
  'TechnicianProfile',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
    bio: { type: DataTypes.TEXT, allowNull: true },
    experienceYears: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    hourlyRate: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    verificationStatus: {
      type: DataTypes.ENUM(...VERIFICATION_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    },
    verificationNote: { type: DataTypes.TEXT, allowNull: true },
    submittedAt: { type: DataTypes.DATE, allowNull: true },
    verifiedAt: { type: DataTypes.DATE, allowNull: true },
    verifiedBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    featured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    isAvailable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    avgRating: { type: DataTypes.DECIMAL(3, 2), allowNull: false, defaultValue: 0 },
    reviewCount: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    ratingDistribution: jsonAttr('ratingDistribution', { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }),
    ...softDeleteAttribute,
  },
  {
    tableName: 'technician_profiles',
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['verification_status'] },
      { fields: ['featured'] },
      { fields: ['avg_rating'] },
      { fields: ['is_available'] },
    ],
  }
);

export const TechnicianDocument = sequelize.define(
  'TechnicianDocument',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    technicianProfileId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    type: { type: DataTypes.ENUM(...DOCUMENT_TYPES), allowNull: false },
    filePath: { type: DataTypes.STRING(500), allowNull: false },
    originalName: { type: DataTypes.STRING(255), allowNull: false },
    mimeType: { type: DataTypes.STRING(120), allowNull: false },
    sizeBytes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    ...softDeleteAttribute,
  },
  {
    tableName: 'technician_documents',
    underscored: true,
    paranoid: true,
    indexes: [{ fields: ['technician_profile_id'] }, { fields: ['type'] }],
  }
);

export const TechnicianSkill = sequelize.define(
  'TechnicianSkill',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    technicianProfileId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    categoryId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  },
  {
    tableName: 'technician_skills',
    underscored: true,
    indexes: [
      { unique: true, fields: ['technician_profile_id', 'category_id'] },
      { fields: ['category_id'] },
    ],
  }
);

export const TechnicianArea = sequelize.define(
  'TechnicianArea',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    technicianProfileId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    city: { type: DataTypes.STRING(120), allowNull: false },
    ...softDeleteAttribute,
  },
  {
    tableName: 'technician_areas',
    underscored: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['technician_profile_id', 'city'] },
      { fields: ['city'] },
    ],
  }
);

export const TechnicianAvailability = sequelize.define(
  'TechnicianAvailability',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    technicianProfileId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    // 0 = Sunday ... 6 = Saturday
    dayOfWeek: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
    startTime: { type: DataTypes.TIME, allowNull: false },
    endTime: { type: DataTypes.TIME, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    ...softDeleteAttribute,
  },
  {
    tableName: 'technician_availability',
    underscored: true,
    paranoid: true,
    indexes: [{ unique: true, fields: ['technician_profile_id', 'day_of_week'] }],
  }
);