import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import technicianRoutes from './technician.routes.js';
import categoryRoutes from './category.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import notificationRoutes from './notification.routes.js';
import requestRoutes from './request.routes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'FixitNow API is running', data: { time: new Date() } });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/technicians', technicianRoutes);
router.use('/categories', categoryRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/requests', requestRoutes);

export default router;