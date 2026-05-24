import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as notificationController from '../controllers/notificationController';

const router = Router();

router.get('/', asyncHandler(notificationController.list));
router.put('/:id/read', asyncHandler(notificationController.markRead));

export default router;
