import { Request, Response } from 'express';
import { cardsRepository } from './cards.service';
import { paginationSchema, cardSearchSchema } from './cards.service';
import { asyncHandler, ValidationError, NotFoundError } from '../../middleware/error-handler';
import { z } from 'zod';

export class CardsController {
  async getCards(req: Request, res: Response): Promise<void> {
    const parsed = paginationSchema.extend({
      setId: z.string().uuid().optional(),
    }).safeParse(req.query);

    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    const { page, pageSize, setId } = parsed.data;
    const result = await cardsRepository.findAll(setId, page, pageSize);

    res.json({
      items: result.items,
      pagination: {
        page,
        pageSize,
        totalItems: result.total,
        totalPages: Math.ceil(result.total / pageSize),
      },
    });
  }

  async searchCards(req: Request, res: Response): Promise<void> {
    const parsed = cardSearchSchema.safeParse(req.query);

    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    const { page, pageSize, name, setId } = parsed.data;
    const result = await cardsRepository.search(name, setId, page, pageSize);

    res.json({
      items: result.items,
      pagination: {
        page,
        pageSize,
        totalItems: result.total,
        totalPages: Math.ceil(result.total / pageSize),
      },
    });
  }

  async getCardDetail(req: Request, res: Response): Promise<void> {
    const cardId = req.params.cardId;
    
    if (!cardId || Array.isArray(cardId)) {
      throw new ValidationError('Card ID is required');
    }

    const card = await cardsRepository.findById(cardId);

    if (!card) {
      throw new NotFoundError('Card not found');
    }

    res.json(card);
  }
}

export const cardsController = new CardsController();
