import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { customerDashboard, technicianDashboard } from '../../controllers/dashboard.controller.js';

const router = Router();
router.use(authenticate);

router.get('/customer', authorize('customer', 'admin'), customerDashboard);
router.get('/technician', authorize('technician', 'admin'), technicianDashboard);

export default router;