import express, { Router, Request, Response } from 'express';
import { AdminController } from './admin.controller';

const router: Router = express.Router();
const adminController = new AdminController();

// Debug endpoints - Get raw API responses
router.get('/api-debug/pokemontcg/sets', (req: Request, res: Response) => adminController.getPokemonTCGSets(req, res));
router.get('/api-debug/pokemontcg/cards', (req: Request, res: Response) => adminController.getPokemonTCGCards(req, res));
router.get('/api-debug/tcgdex/sets', (req: Request, res: Response) => adminController.getTCGdexSets(req, res));
router.get('/api-debug/tcgcsv/groups', (req: Request, res: Response) => adminController.getTCGCSVGroups(req, res));

// Sync endpoints - Actually save to DB
router.post('/sync/sets/pokemontcg', (req: Request, res: Response) => adminController.syncPokemonTCGSets(req, res));
router.post('/sync/cards/:setId', (req: Request, res: Response) => adminController.syncCardsBySet(req, res));
router.post('/sync/cards', (req: Request, res: Response) => adminController.syncAllCards(req, res));
router.post('/sync/products/:groupId', (req: Request, res: Response) => adminController.syncProductsByGroup(req, res));
router.post('/sync/products', (req: Request, res: Response) => adminController.syncAllProducts(req, res));

// Log endpoints
router.get('/logs', (req: Request, res: Response) => adminController.getApiLogs(req, res));

// Status endpoints
router.get('/status/db', (req: Request, res: Response) => adminController.getDbStatus(req, res));

export default router;
