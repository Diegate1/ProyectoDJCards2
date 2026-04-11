import express, { Router, Request, Response } from 'express';
import { DataController } from './data.controller';

const router: Router = express.Router();
const dataController = new DataController();

// Sets - Dashboard
router.get('/sets/search', (req: Request, res: Response) => dataController.searchSets(req, res));
router.get('/sets', (req: Request, res: Response) => dataController.getSets(req, res));

// Cards - Listado y búsqueda
router.get('/cards/search', (req: Request, res: Response) => dataController.searchCards(req, res));
router.get('/cards/:cardId', (req: Request, res: Response) => dataController.getCardDetails(req, res));
router.get('/cards', (req: Request, res: Response) => dataController.getCards(req, res));

// Cards - Legacy compatibility (ruta antigua)
router.get('/sets/:setId/cards', (req: Request, res: Response) => dataController.getCardsBySet(req, res));

// Prices - Histórico (para gráficos futuros)
router.get('/prices/card', (req: Request, res: Response) => dataController.getCardPrices(req, res));

// Products - Sealed items
router.get('/products/sealed', (req: Request, res: Response) => dataController.getSealedProducts(req, res));

// Stats - Estadísticas generales
router.get('/stats', (req: Request, res: Response) => dataController.getStats(req, res));

export default router;
