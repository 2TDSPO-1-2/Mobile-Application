import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as evaluationController from '../controllers/evaluationController';

const router = Router();

router.get('/', asyncHandler(evaluationController.list));
router.post('/', asyncHandler(evaluationController.create));

export default router;
