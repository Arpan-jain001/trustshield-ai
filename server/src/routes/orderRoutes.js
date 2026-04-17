import { Router } from 'express';
import { createOrder, getOrderStatus } from '../controllers/orderController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', requireAuth, createOrder);
router.get('/:orderId', requireAuth, getOrderStatus);

export default router;
