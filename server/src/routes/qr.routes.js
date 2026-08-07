import { Router } from 'express';
import { generateQR, getQRDataUrl } from '../controllers/qr.controller.js';

const router = Router();

// Generate QR code image (PNG/SVG)
router.get('/:shortCode', generateQR);

// Get QR code as base64 data URL
router.get('/:shortCode/data', getQRDataUrl);

export default router;
