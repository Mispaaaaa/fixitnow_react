import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import { softDeleteAttribute } from './helpers.js';

const ServiceCategory = sequelize.define(
  'ServiceCategory',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    slug: { type: DataTypes.STRING(140), allowNull: false, unique: true },
    description: { type: DataTypes.STRING(500), allowNull: true },
    icon: { type: DataTypes.STRING(60), allowNull: true },
    imageUrl: { type: DataTypes.STRING(500), allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    isPopular: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    ...softDeleteAttribute,
  },
  {
    tableName: 'service_categories',
    underscored: true,
    paranoid: true,
    indexes: [{ fields: ['is_active'] }, { fields: ['sort_order'] }],
  }
);

export default ServiceCategory;