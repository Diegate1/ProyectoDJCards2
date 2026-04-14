import { Request, Response } from 'express';
import { z } from 'zod';
import { setsRepository, SetFilters } from './sets.service';
import { setSearchSchema } from './sets.service';
import { asyncHandler, ValidationError } from '../../middleware/error-handler';

export class SetsController {
  async getSets(req: Request, res: Response): Promise<void> {
    console.log('[getSets] req.query:', req.query);
    
    const parsed = setSearchSchema.safeParse(req.query);
    if (!parsed.success) {
      console.log('[getSets] Zod parse error:', parsed.error.errors);
      throw new ValidationError(parsed.error.errors[0].message);
    }

    console.log('[getSets] parsed.data:', parsed.data);

    const { page, pageSize, releaseDateFrom, releaseDateTo, cardCountFrom, cardCountTo } = parsed.data;
    const filters: SetFilters = {
      releaseDateFrom,
      releaseDateTo,
      cardCountFrom,
      cardCountTo,
    };

    console.log('[getSets] filters:', filters);

    const result = await setsRepository.findAll(page, pageSize, filters);

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
    const parsed = setSearchSchema.extend({
      name: z.string().min(1),
    }).safeParse(req.query);

    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    const { page, pageSize, name, releaseDateFrom, releaseDateTo, cardCountFrom, cardCountTo } = parsed.data;
    const filters: SetFilters = {
      releaseDateFrom,
      releaseDateTo,
      cardCountFrom,
      cardCountTo,
    };

    const result = await setsRepository.search(name, page, pageSize, filters);

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
