import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as appointmentController from '../controllers/appointmentController';

const router = Router();

router.get('/', asyncHandler(appointmentController.list));
router.get('/:id', asyncHandler(appointmentController.getById));
router.post('/', asyncHandler(appointmentController.create));
router.put('/:id/status', asyncHandler(appointmentController.updateStatus));

export default router;
