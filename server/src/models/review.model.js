import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import { jsonAttr, softDeleteAttribute } from './helpers.js';

const Review = sequelize.define(
  'Review',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    requestId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
    customerId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    technicianId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    rating: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
    comment: { type: DataTypes.TEXT, allowNull: true },
    tags: jsonAttr('tags', []),
    isHidden: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    hiddenNote: { type: DataTypes.STRING(500), allowNull: true },
    hiddenBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    hiddenAt: { type: DataTypes.DATE, allowNull: true },
    reply: { type: DataTypes.TEXT, allowNull: true },
    repliedAt: { type: DataTypes.DATE, allowNull: true },
    ...softDeleteAttribute,
  },
  {
    tableName: 'reviews',
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['technician_id'] },
      { fields: ['customer_id'] },
      { fields: ['rating'] },
      { fields: ['is_hidden'] },
    ],
  }
);

export default Review;