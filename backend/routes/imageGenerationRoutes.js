import express from 'express';
import { generateImage } from '../controllers/imageGenerationController.js';

const router = express.Router();

// Placeholder for authentication middleware
let protect = (req, res, next) => { 
  console.warn('Bypassing actual authentication in imageGenerationRoutes.js. Ensure protect middleware is correctly implemented or updated for ESM.'); 
  next(); 
};

// Attempt to load authMiddleware using ESM-style import
(async () => {
  try {
    const authModule = await import('../middleware/authMiddleware.js'); 
    if (authModule && typeof authModule.protect === 'function') {
      protect = authModule.protect;
      console.log('Successfully loaded protect middleware (named export) in imageGenerationRoutes.js using dynamic import.');
    } else if (authModule && authModule.default && typeof authModule.default.protect === 'function') {
        protect = authModule.default.protect;
        console.log('Successfully loaded protect middleware (default export) in imageGenerationRoutes.js using dynamic import.');
    } else {
      console.warn('authMiddleware.js loaded via dynamic import but does not export protect as expected. Using bypass.');
    }
  } catch (e) {
    console.warn('Failed to dynamically import authMiddleware.js, using bypass. Error:', e.message);
    console.warn('Ensure authMiddleware.js exists at ../middleware/authMiddleware.js and is ESM or CJS compatible for dynamic import.');
  }
})();

// POST /api/v1/images/generate
router.post('/generate', protect, generateImage);

export default router; 