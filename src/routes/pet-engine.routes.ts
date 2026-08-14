import { Router } from 'express';
import { PetEngineController } from '../controllers/pet-engine.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/types', PetEngineController.getPetTypes);
router.get('/', PetEngineController.getMyPets);
router.post('/', PetEngineController.createPet);
router.post('/:petId/feed', PetEngineController.feedPet);
router.post('/:petId/play', PetEngineController.playWithPet);
router.post('/:petId/sleep', PetEngineController.sleepPet);
router.post('/:petId/clean', PetEngineController.cleanPet);
router.patch('/:petId/rename', PetEngineController.renamePet);
router.delete('/:petId', PetEngineController.releasePet);
router.get('/stats', PetEngineController.getPetStats);

export default router;
