import { Router } from 'express';
import { cardsController } from './cards.controller';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router();

router.get('/cards', asyncHandler((req, res) => cardsController.getCards(req, res)));
router.get('/cards/search', asyncHandler((req, res) => cardsController.searchCards(req, res)));
router.get('/cards/:cardId', asyncHandler((req, res) => cardsController.getCardDetail(req, res)));

export default router;
