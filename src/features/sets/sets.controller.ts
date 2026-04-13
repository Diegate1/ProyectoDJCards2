import { Request, Response } from 'express';
import { z } from 'zod';
import { setsRepository } from './sets.service';
import { paginationSchema } from './sets.service';
import { asyncHandler, ValidationError } from '../../middleware/error-handler';

export class SetsController {
  async getSets(req: Request, res: Response): Promise<void> {
    const parsed = paginationSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    const { page, pageSize } = parsed.data;
    const result = await setsRepository.findAll(page, pageSize);

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

  async searchSets(req: Request, res: Response): Promise<void> {
    const parsed = paginationSchema.extend({
      name: z.string().min(1),
    }).safeParse(req.query);

    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    const { page, pageSize, name } = parsed.data;
    const result = await setsRepository.search(name, page, pageSize);

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
}

export const setsController = new SetsController();
