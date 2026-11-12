import { DataTypes } from 'sequelize';

/** Common soft-delete column; every user-facing table also sets paranoid: true. */
export const softDeleteAttribute = {
  deletedBy: { type: DataTypes.INTEGER, allowNull: true },
};

export const baseOptions = {
  underscored: true,
  timestamps: true,
};

/** JSON values may arrive as strings on MariaDB, so always parse defensively. */
export function parseJsonValue(raw, fallback) {
  if (raw === null || raw === undefined || raw === '') return fallback;
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/** Attribute definition for a JSON column that normalises MariaDB's string output. */
export function jsonColumn(fallback) {
  return {
    type: DataTypes.JSON,
    allowNull: true,
    get() {
      return parseJsonValue(this.getDataValue(this._jsonAttr), fallback);
    },
  };
}

export function jsonAttr(name, fallback) {
  return {
    type: DataTypes.JSON,
    allowNull: true,
    get() {
      return parseJsonValue(this.getDataValue(name), fallback);
    },
  };
}