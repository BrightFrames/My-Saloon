import { Router } from 'express';
import { SalonsController } from '../controllers/salons.controller';
import { createRateLimit } from '../middlewares/rateLimit';
import { createSalonAdmin } from '../controllers/auth.controller';

const router = Router();
const salonsController = new SalonsController();
const writeLimiter = createRateLimit({
	windowMs: 60_000,
	max: 6,
	code: 'RATE_LIMIT_EXCEEDED',
	message: 'Too many salon changes. Please wait and try again.',
});

router.get('/', salonsController.getSalons);
router.get('/:id', salonsController.getSalonById);
router.post('/:id/reviews', writeLimiter, salonsController.createReview);
router.post('/', writeLimiter, salonsController.createSalon);
router.put('/:id', writeLimiter, salonsController.updateSalon);
// Admin creation for a salon (called from main-admin panel)
router.post('/admin/create', createSalonAdmin);

export default router;
