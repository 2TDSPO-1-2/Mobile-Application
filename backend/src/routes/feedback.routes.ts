import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as feedbackController from '../controllers/feedbackController';

const router = Router();

router.get('/', asyncHandler(feedbackController.list));
router.post('/', asyncHandler(feedbackController.create));

export default router;
