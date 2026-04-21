import { Router } from 'express';
import * as authController from './auth.controller';
import { requireAuth } from '../../middleware/auth.middleware';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', requireAuth, authController.logout);
router.post('/refresh', authController.refresh);
router.get('/me', requireAuth, authController.getMe);
router.patch('/me', requireAuth, authController.updateMe);

export default router;
