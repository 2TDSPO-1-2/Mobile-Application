import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as userController from '../controllers/userController';

const router = Router();

router.get('/', asyncHandler(userController.list));
router.get('/:id', asyncHandler(userController.getById));

export default router;
