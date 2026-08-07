import { Router } from 'express';
import { getAnalytics, getDashboardStats } from '../controllers/analytics.controller.js';

const router = Router();

// Get overall dashboard stats
router.get('/dashboard', getDashboardStats);

// Get analytics for a specific short URL
router.get('/:shortCode', getAnalytics);

export default router;
