import { Op } from 'sequelize';
import sequelize from '../config/db.js';
import {
  ServiceCategory,
  TechnicianArea,
  TechnicianProfile,
  TechnicianSkill,
  Review,
} from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getPagination, pagedData } from '../utils/pagination.js';
import { replaceAreas, replaceAvailability, assertCategoriesExist } from '../services/auth.service.js';

const directoryInclude = [
  {
    association: 'user',
    attributes: ['id', 'name', 'avatarUrl', 'lastActiveAt', 'createdAt'],
    where: { isActive: true },
  },
  { association: 'skills', through: { attributes: [] } },
  { association: 'areas' },
];

function publicProfileJSON(profile) {
  const json = profile.toJSON();
  if (json.user) json.name = json.user.name;
  return json;
}

export const listTechnicians = asyncHandler(async (req, res) => {
  const query = req.validatedQuery;
  const { page, limit, offset } = getPagination(query, 12);
  const where = { verificationStatus: 'verified', isAvailable: true };
  if (query.featured === 'true') where.featured = true;
  if (query.minRating) where.avgRating = { [Op.gte]: query.minRating };

  const include = directoryInclude.map((item) => ({ ...item }));
  const userInclude = include[0];
  if (query.q) userInclude.where = { ...userInclude.where, name: { [Op.like]: `%${query.q}%` } };
  userInclude.required = true;

  const skillInclude = include[1];
  if (query.categoryId) {
    skillInclude.where = { id: query.categoryId };
    skillInclude.required = true;
  }

  const areaInclude = include[2];
  if (query.city) {
    areaInclude.where = { city: query.city };
    areaInclude.required = true;
  }

  const order =
    query.sort === 'newest'
      ? [['createdAt', 'DESC']]
      : query.sort === 'jobs'
        ? [['reviewCount', 'DESC']]
        : [
            ['avgRating', 'DESC'],
            ['reviewCount', 'DESC'],
          ];

  const { count, rows } = await TechnicianProfile.findAndCountAll({
    where,
    include,
    order,
    limit,
    offset,
    distinct: true,
    subQuery: false,
  });

  let items = rows.map(publicProfileJSON);

  res.json({
    success: true,
    message: 'OK',
    data: pagedData(items, count, page, limit),
  });
});

export const getPublicTechnician = asyncHandler(async (req, res) => {
  const profile = await TechnicianProfile.findOne({
    where: { userId: req.params.id },
    include: [
      {
        association: 'user',
        attributes: ['id', 'name', 'avatarUrl', 'lastActiveAt', 'createdAt'],
        where: { isActive: true },
      },
      { association: 'skills', through: { attributes: [] } },
      { association: 'areas' },
      { association: 'availability', where: { isActive: true }, required: false },
    ],
  });
  if (!profile) throw ApiError.notFound('Technician not found');
  if (profile.verificationStatus !== 'verified' && req.user?.role !== 'admin') {
    throw ApiError.notFound('Technician not found');
  }
  res.json({ success: true, message: 'OK', data: { profile: publicProfileJSON(profile) } });
});

export const getMyTechnicianProfile = asyncHandler(async (req, res) => {
  if (req.user.role !== 'technician') throw ApiError.forbidden('Technician account required');
  const profile = await TechnicianProfile.findOne({
    where: { userId: req.user.id },
    include: [
      { association: 'skills', through: { attributes: [] } },
      { association: 'areas' },
      { association: 'availability' },
      { association: 'documents' },
    ],
  });
  res.json({ success: true, message: 'OK', data: { profile } });
});

export const updateMyTechnicianProfile = asyncHandler(async (req, res) => {
  if (req.user.role !== 'technician') throw ApiError.forbidden('Technician account required');
  const profile = await TechnicianProfile.findOne({ where: { userId: req.user.id } });
  if (!profile) throw ApiError.notFound('Technician profile not found');

  const { skillCategoryIds, cities, availability, ...fields } = req.body;
  await assertCategoriesExist(skillCategoryIds);

  const transaction = await sequelize.transaction();
  try {
    await profile.update(fields, { transaction });
    if (skillCategoryIds) {
      await TechnicianSkill.destroy({
        where: { technicianProfileId: profile.id },
        transaction,
      });
      if (skillCategoryIds.length) {
        await TechnicianSkill.bulkCreate(
          [...new Set(skillCategoryIds)].map((categoryId) => ({
            technicianProfileId: profile.id,
            categoryId,
          })),
          { transaction }
        );
      }
    }
    await replaceAreas(profile.id, cities, req.user.id);
    await replaceAvailability(profile.id, availability, req.user.id);
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  const refreshed = await TechnicianProfile.findByPk(profile.id, {
    include: [
      { association: 'skills', through: { attributes: [] } },
      { association: 'areas' },
      { association: 'availability' },
    ],
  });
  res.json({ success: true, message: 'Profile updated', data: { profile: refreshed } });
});

export const listTechnicianReviews = asyncHandler(async (req, res) => {
  const technician = await TechnicianProfile.findOne({
    where: { userId: req.params.id, verificationStatus: 'verified' },
  });
  if (!technician) throw ApiError.notFound('Technician not found');

  const { page, limit, offset } = getPagination(req.query, 6);
  const { count, rows } = await Review.findAndCountAll({
    where: { technicianId: req.params.id, isHidden: false },
    include: [
      {
        association: 'customer',
        attributes: ['id', 'name', 'avatarUrl'],
      },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    distinct: true,
  });

  res.json({
    success: true,
    message: 'OK',
    data: {
      ...pagedData(rows, count, page, limit),
      summary: {
        avgRating: technician.avgRating,
        reviewCount: technician.reviewCount,
        ratingDistribution: technician.ratingDistribution,
      },
    },
  });
});

export const getFilterMeta = asyncHandler(async (req, res) => {
  const [categories, areas] = await Promise.all([
    ServiceCategory.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC']],
      attributes: ['id', 'name', 'slug', 'icon', 'isPopular'],
    }),
    TechnicianArea.findAll({
      attributes: ['city'],
      group: ['city'],
      order: [['city', 'ASC']],
      raw: true,
    }),
  ]);
  res.json({
    success: true,
    message: 'OK',
    data: { categories, cities: areas.map((item) => item.city) },
  });
});