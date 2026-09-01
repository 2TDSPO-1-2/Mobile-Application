import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as animalController from '../controllers/animalController';

const router = Router();

router.get('/', asyncHandler(animalController.list));
router.get('/:id', asyncHandler(animalController.getById));
router.post('/', asyncHandler(animalController.create));
router.put('/:id', asyncHandler(animalController.update));
router.delete('/:id', asyncHandler(animalController.remove));

export default router;
