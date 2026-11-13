import sequelize from '../config/db.js';
import { SavedAddress } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { softDeleteRecord } from '../utils/softDelete.js';
import { isServiceLocation } from '../utils/serviceArea.js';

function assertServiceLocation(location) {
  if (!isServiceLocation(location)) {
    throw ApiError.badRequest(
      'FixitNow currently serves Oriental Mindoro only. Choose a municipality in the province and a location pin within the service area.'
    );
  }
}

export const listAddresses = asyncHandler(async (req, res) => {
  const addresses = await SavedAddress.findAll({
    where: { userId: req.user.id },
    order: [
      ['isDefault', 'DESC'],
      ['createdAt', 'DESC'],
    ],
  });
  res.json({ success: true, message: 'OK', data: { items: addresses } });
});

export const createAddress = asyncHandler(async (req, res) => {
  assertServiceLocation(req.body);
  const transaction = await sequelize.transaction();
  try {
    if (req.body.isDefault) {
      await SavedAddress.update(
        { isDefault: false },
        { where: { userId: req.user.id }, transaction }
      );
    }
    const address = await SavedAddress.create(
      { ...req.body, userId: req.user.id },
      { transaction }
    );
    await transaction.commit();
    res.status(201).json({ success: true, message: 'Address saved', data: address });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

export const updateAddress = asyncHandler(async (req, res) => {
  const address = await SavedAddress.findOne({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!address) throw ApiError.notFound('Address not found');
  assertServiceLocation({
    city: req.body.city ?? address.city,
    lat: req.body.lat ?? address.lat,
    lng: req.body.lng ?? address.lng,
  });

  const transaction = await sequelize.transaction();
  try {
    if (req.body.isDefault) {
      await SavedAddress.update(
        { isDefault: false },
        { where: { userId: req.user.id }, transaction }
      );
    }
    await address.update(req.body, { transaction });
    await transaction.commit();
    res.json({ success: true, message: 'Address updated', data: address });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const address = await SavedAddress.findOne({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!address) throw ApiError.notFound('Address not found');
  await softDeleteRecord(address, req.user.id);
  res.json({ success: true, message: 'Address removed', data: null });
});