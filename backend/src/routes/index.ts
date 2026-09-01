import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import animalRoutes from './animal.routes';
import appointmentRoutes from './appointment.routes';
import evaluationRoutes from './evaluation.routes';
import feedbackRoutes from './feedback.routes';
import notificationRoutes from './notification.routes';
import searchRoutes from './search.routes';

const router = Router();

router.use(healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/animals', animalRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/evaluations', evaluationRoutes);
router.use('/feedbacks', feedbackRoutes);
router.use('/notifications', notificationRoutes);
router.use('/search', searchRoutes);

export default router;
