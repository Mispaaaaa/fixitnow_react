import { Router } from 'express';
import { ServiceCategory } from '../../models/index.js';
import asyncHandler from '../../utils/asyncHandler.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const categories = await ServiceCategory.findAll({
      where: { isActive: true },
      order: [
        ['sortOrder', 'ASC'],
        ['name', 'ASC'],
      ],
    });
    res.json({ success: true, message: 'OK', data: { items: categories } });
  })
);

export default router;