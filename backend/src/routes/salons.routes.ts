import { Router } from 'express';
import { SalonsController } from '../controllers/salons.controller';

const router = Router();
const salonsController = new SalonsController();

router.get('/', salonsController.getSalons);
router.get('/:id', salonsController.getSalonById);
router.post('/', salonsController.createSalon);

export default router;
