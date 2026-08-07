import { Router } from 'express';
import { createShortUrl, getAllUrls, getUrlByCode, deleteUrl, checkAlias } from '../controllers/url.controller.js';
import { verifyPassword } from '../controllers/redirect.controller.js';

const router = Router();

// Create a new short URL
router.post('/shorten', createShortUrl);

// Get all URLs (paginated)
router.get('/urls', getAllUrls);

// Check alias availability
router.get('/check-alias/:alias', checkAlias);

// Get URL by short code
router.get('/urls/:shortCode', getUrlByCode);

// Verify password for a protected link
router.post('/urls/:shortCode/verify', verifyPassword);

// Delete URL (soft delete)
router.delete('/urls/:shortCode', deleteUrl);

export default router;
