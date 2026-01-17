import {
  ProductPagedSearchResponse,
  ProductSearchRequest,
  ProductType,
} from '@commercetools/platform-sdk';
import { createApiRoot } from '../client/create.client';
import { logger } from '../utils/logger.utils';
export const searchProducts = async (
  searchParams: ProductSearchRequest
): Promise<ProductPagedSearchResponse> => {
  try {
    logger.info('Searching products with params:', searchParams);
    const apiRoot = createApiRoot();

    const response = await apiRoot
      .products()
      .search()
      .post({
        body: searchParams,
      })
      .execute();

    return response.body;
  } catch (error) {
    logger.error('Error searching products:', error);
    throw error;
  }
};

export const getProductTypeById = async (id: string): Promise<ProductType> => {
  try {
    logger.info(`Fetching product type with ID: ${id}`);
    const apiRoot = createApiRoot();

    const response = await apiRoot
      .productTypes()
      .withId({ ID: id })
      .get()
      .execute();

    return response.body;
  } catch (error) {
    logger.error('Error fetching product type by ID:', error);
    throw error;
  }
};
