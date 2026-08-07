import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createShortUrl, getAllUrls, getUrlByCode, deleteUrl, checkAlias } from '../controllers/url.controller.js';
import { verifyPassword } from '../controllers/redirect.controller.js';

const router = Router();

// Strict Rate Limiter for Password Brute-force protection: Max 5 attempts per minute
const passwordVerifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many password attempts, please try again after 60 seconds.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Create a new short URL
router.post('/shorten', createShortUrl);

// Get all URLs (paginated)
router.get('/urls', getAllUrls);

// Check alias availability
router.get('/check-alias/:alias', checkAlias);

// Get URL by short code
router.get('/urls/:shortCode', getUrlByCode);

// Verify password for a protected link
router.post('/urls/:shortCode/verify', passwordVerifyLimiter, verifyPassword);

// Delete URL (soft delete)
router.delete('/urls/:shortCode', deleteUrl);

export default router;
