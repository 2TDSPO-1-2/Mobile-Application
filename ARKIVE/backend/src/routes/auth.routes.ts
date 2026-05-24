import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as authController from '../controllers/authController';

const router = Router();

router.post('/login', asyncHandler(authController.login));
router.post('/register', asyncHandler(authController.register));

export default router;
