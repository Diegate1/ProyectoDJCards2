import { v4 as uuidv4 } from 'uuid';
import { database } from '../../db/database';
import { tcgcsvClient } from '../tcgcsv/tcgcsv.client';
import { TCGplayerProduct, TCGplayerPrice } from '../../common/types';

export class ProductSyncService {
  async syncProductsByGroup(groupId: number): Promise<{ synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;

    console.log(`Starting product synchronization for group ${groupId}...`);

    try {
      const { products, prices } = await tcgcsvClient.getProductsAndPrices(3, groupId);

      console.log(`Fetched ${products.length} products and ${prices.length} price entries for group ${groupId}`);

      for (const product of products) {
        try {
          const productId = await this.upsertProduct(product, groupId);
          synced++;

          // Procesar precios para este producto
          const productPrices = prices.filter(p => p.productId === product.productId);
          if (productPrices.length > 0) {
            await this.upsertPrices(productId, productPrices);
          }
        } catch (error) {
            const errorMsg = `Failed to sync product ${product.productId}: ${(error as Error).message}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      console.log(`✓ Product sync for group ${groupId} completed. Synced: ${synced}, Errors: ${errors.length}`);
    } catch (error) {
      const errorMsg = `Critical error during product sync for group ${groupId}: ${(error as Error).message}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }

    return { synced, errors };
  }

  async syncAllGroupsProducts(): Promise<{ totalSynced: number; totalErrors: number }> {
    try {
      const groups = await tcgcsvClient.getGroups();
      let totalSynced = 0;
      let totalErrors = 0;

      console.log(`Syncing products for ${groups.length} groups...`);

      for (const group of groups) {
        try {
          const result = await this.syncProductsByGroup(group.groupId);
          totalSynced += result.synced;
          totalErrors += result.errors.length;
        } catch (error) {
          console.error(`Error syncing group ${group.groupId}:`, error);
          totalErrors++;
        }
      }

      console.log(`✓ All groups product sync completed. Total synced: ${totalSynced}, Total errors: ${totalErrors}`);
      return { totalSynced, totalErrors };
    } catch (error) {
      console.error('Error in syncAllGroupsProducts:', error);
      throw error;
    }
  }

  private async upsertProduct(product: TCGplayerProduct, groupId: number): Promise<string> {
    try {
      // Determinar tipo de producto
      const productType = this.classifyProduct(product);

      // Intentar encontrar el set interno asociado (si es possible)
      let internalSetId: string | null = null;

      if (productType === 'single_card') {
        // Intentar mapear por número de carta
        internalSetId = await this.findSetByProduct(product);
      }

      // Buscar referencia existente
      const existingResult = await database.query(
        `SELECT id FROM products 
         WHERE source_code = $1 AND external_product_id = $2`,
        ['tcgcsv', product.productId.toString()]
      );

      let productId: string;

      if (existingResult.rows.length > 0) {
        productId = existingResult.rows[0].id;
      } else {
        productId = uuidv4();
      }

      const sql = `
        INSERT INTO products (
          id, set_id, source_code, external_product_id,
          group_external_id, name, clean_name, product_type,
          image_url, product_url, extended_data_raw,
          metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (source_code, external_product_id) DO UPDATE SET
          set_id = EXCLUDED.set_id,
          name = EXCLUDED.name,
          clean_name = EXCLUDED.clean_name,
          product_type = EXCLUDED.product_type,
          image_url = EXCLUDED.image_url,
          product_url = EXCLUDED.product_url,
          extended_data_raw = EXCLUDED.extended_data_raw,
          metadata = EXCLUDED.metadata,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id
      `;

      const result = await database.query(sql, [
        productId,
        internalSetId || null,
        'tcgcsv',
        product.productId.toString(),
        groupId.toString(),
        product.name,
        product.cleanName || null,
        productType,
        product.imageUrl || null,
        product.url || null,
        product.extendedData ? JSON.stringify(product.extendedData) : null,
        JSON.stringify({
          categoryId: product.categoryId,
          groupId: product.groupId,
          imageCount: product.imageCount,
        }),
      ]);

      console.log(`✓ Product synced: ${product.cleanName || product.name} (${product.productId})`);
      return result.rows[0].id;
    } catch (error) {
      console.error(`Error upserting product ${product.productId}:`, error);
      throw error;
    }
  }

  private async upsertPrices(productId: string, prices: TCGplayerPrice[]): Promise<void> {
    try {
      for (const price of prices) {
        const sql = `
          INSERT INTO product_prices (
            product_id, variant_name, currency,
            low_price, mid_price, high_price,
            market_price, direct_low_price,
            captured_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
        `;

        await database.query(sql, [
          productId,
          price.subTypeName || 'Normal',
          'USD',
          price.lowPrice || null,
          price.midPrice || null,
          price.highPrice || null,
          price.marketPrice || null,
          price.directLowPrice || null,
        ]);
      }
    } catch (error) {
      console.error(`Error upserting prices for product ${productId}:`, error);
      // No lanzamos error para no interrumpir el flujo
    }
  }

  private classifyProduct(product: TCGplayerProduct): 'single_card' | 'sealed_product' | 'unknown' {
    // Primera regla: revisar extendedData
    if (product.extendedData && product.extendedData.length > 0) {
      const dataNames = product.extendedData.map(d => d.name?.toLowerCase() || '');

      // Indicadores de carta individual
      if (dataNames.includes('number') || dataNames.includes('rarity')) {
        return 'single_card';
      }

      // Indicadores de producto sellado
      if (dataNames.some(name => 
        name.includes('booster') || 
        name.includes('elite') || 
        name.includes('tin') ||
        name.includes('collection')
      )) {
        return 'sealed_product';
      }
    }

    // Segunda regla: revisar nombre
    const nameLower = (product.cleanName || product.name).toLowerCase();
    const sealedKeywords = [
      'booster box',
      'elite trainer',
      'tin',
      'blister',
      'sleeved booster',
      'collection',
      'premium collection',
      'build & battle',
      'deck box',
      'theme deck',
    ];

    if (sealedKeywords.some(keyword => nameLower.includes(keyword))) {
      return 'sealed_product';
    }

    // Fallback
    return 'unknown';
  }

  private async findSetByProduct(product: TCGplayerProduct): Promise<string | null> {
    try {
      if (!product.extendedData) {
        return null;
      }

      // Buscar el campo "Number" que típicamente contiene el set code
      const numberField = product.extendedData.find(
        d => d.name?.toLowerCase() === 'number'
      );

      if (!numberField || !numberField.value) {
        return null;
      }

      const cardNumber = numberField.value;
      // Extraer set id del formato típico "sv1-1", "sv1-123", etc.
      const match = cardNumber.match(/^([a-z0-9]+)-\d+/i);

      if (!match) {
        return null;
      }

      const setCode = match[1];

      // Buscar en external_refs
      const result = await database.query(
        `SELECT set_id FROM set_external_refs
         WHERE source_code = $1 AND external_code = $2
         LIMIT 1`,
        ['pokemontcg', setCode.toLowerCase()]
      );

      if (result.rows.length > 0) {
        return result.rows[0].set_id;
      }

      return null;
    } catch (error) {
      console.error('Error finding set by product:', error);
      return null;
    }
  }
}

export const productSyncService = new ProductSyncService();
