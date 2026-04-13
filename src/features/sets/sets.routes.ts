import { Router } from 'express';
import { setsController } from './sets.controller';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router();

router.get('/sets', asyncHandler((req, res) => setsController.getSets(req, res)));
router.get('/sets/search', asyncHandler((req, res) => setsController.searchSets(req, res)));

export default router;
