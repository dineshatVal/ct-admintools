import {
  useMcMutation,
  useMcQuery,
} from '@commercetools-frontend/application-shell';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import {
  GRAPHQL_TARGETS,
  MC_API_PROXY_TARGETS,
} from '@commercetools-frontend/constants';
import {
  actions,
  TSdkAction,
  useAsyncDispatch,
} from '@commercetools-frontend/sdk';
import { TState } from '@commercetools-uikit/hooks';
import {
  Product,
  ProductDraft,
  ProductPagedSearchResponse,
  ProductProjection,
  ProductProjectionPagedQueryResponse,
  ProductTailoring,
  ProductTailoringInStoreDraft,
  ProductTailoringUpdateAction,
} from '@commercetools/platform-sdk';
import gql from 'graphql-tag';
import { useCallback, useState } from 'react';
import logger from '../../../utils/logger';
import { useAuthContext } from '../../contexts/auth-context';
import {
  addProductsToCache,
  mergeCacheWithResults,
  PRODUCTS_FROM_MASTER_TO_STORE_KEY,
  PRODUCTS_FROM_STORE_TO_MASTER_KEY,
  removeProductsFromCache,
} from './cache-controller';
import {
  mapProductSearchResponse,
  mapProdutProjectionResponse,
} from './mapper';
import {
  ProductSearchResult,
  ProductSelectionResponse,
  UseStoreProductsResult,
} from './types';

// GraphQL mutation to update product selection
const UPDATE_PRODUCT_SELECTION_MUTATION = gql`
  mutation UpdateProductSelection(
    $id: String!
    $version: Long!
    $actions: [ProductSelectionUpdateAction!]!
  ) {
    updateProductSelection(id: $id, version: $version, actions: $actions) {
      id
      version
    }
  }
`;

// GraphQL query to get product selection ID and version by key
const GET_PRODUCT_SELECTION_BY_ID = gql`
  query GetProductSelectionById($id: String!) {
    productSelection(id: $id) {
      id
      version
    }
  }
`;

const buildSearchQuery = (
  includeProductSelectionId: string,
  excludeProductSelectionId?: string,
  searchText?: string,
  locale?: string
) => {
  const andExpressions = [];
  if (includeProductSelectionId) {
    andExpressions.push({
      exact: {
        field: 'productSelections',
        value: includeProductSelectionId,
      },
    });
  }

  if (excludeProductSelectionId) {
    andExpressions.push({
      not: [
        {
          exact: {
            field: 'productSelections',
            value: excludeProductSelectionId,
          },
        },
      ],
    });
  }

  if (searchText) {
    andExpressions.push({
      wildcard: {
        field: 'name',
        language: locale,
        value: `*${searchText}*`,
        caseInsensitive: true,
      },
    });
  }

  const query =
    andExpressions.length > 1
      ? {
          and: andExpressions,
        }
      : andExpressions[0];

  return query;
};

const useStoreProducts = ({
  page,
  perPage,
}: {
  page?: TState;
  perPage?: TState;
}): UseStoreProductsResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { dataLocale, project } = useApplicationContext((context) => ({
    dataLocale: context.dataLocale ?? 'en-us',
    project: context.project,
  }));
  const dispatchProductSearch = useAsyncDispatch<
    TSdkAction,
    ProductPagedSearchResponse
  >();
  const dispatchProductProjection = useAsyncDispatch<
    TSdkAction,
    ProductProjectionPagedQueryResponse
  >();
  const dispatchProduct = useAsyncDispatch<TSdkAction, ProductProjection>();
  const dispatchProductCreate = useAsyncDispatch<TSdkAction, Product>();
  const dispatchProductTailoring = useAsyncDispatch<
    TSdkAction,
    ProductTailoring
  >();
  const dispatchProductTailoringUpdate = useAsyncDispatch<
    TSdkAction,
    ProductTailoring
  >();
  const dispatchProductTailoringCreate = useAsyncDispatch<
    TSdkAction,
    ProductTailoring
  >();

  const { masterProductSelectionId, productSelectionId, storeKey } =
    useAuthContext();

  const getProductById = useCallback(
    async (productId: string) => {
      const result = await dispatchProduct(
        actions.get({
          mcApiProxyTarget: MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM,
          uri: `/${project?.key}/in-store/key=${storeKey}/product-projections/${productId}`,
        })
      );
      return result;
    },
    [project?.key, dispatchProduct, storeKey]
  );

  const getProductTailoringInStore = useCallback(
    async (productId: string) => {
      try {
        const result = await dispatchProductTailoring(
          actions.get({
            mcApiProxyTarget: MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM,
            uri: `/${project?.key}/in-store/key=${storeKey}/products/${productId}/product-tailoring`,
          })
        );
        return result;
      } catch (error) {
        return null;
      }
    },
    [project?.key, dispatchProduct, storeKey]
  );

  const createProductTailoring = useCallback(
    async (product: ProductTailoringInStoreDraft) => {
      const result = await dispatchProductTailoringCreate(
        actions.post({
          mcApiProxyTarget: MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM,
          uri: `/${project?.key}/in-store/key=${storeKey}/product-tailoring`,
          payload: product,
        })
      );
      return result;
    },
    [project?.key, dispatchProductTailoringCreate, storeKey]
  );

  const updateProductTailoring = useCallback(
    async (
      productId: string,
      updateActions: ProductTailoringUpdateAction[]
    ) => {
      if (!updateActions.length) {
        return null;
      }

      const productTailoring = await getProductTailoringInStore(productId);
      if (!productTailoring) {
        return null;
      }

      const result = await dispatchProductTailoringUpdate(
        actions.post({
          mcApiProxyTarget: MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM,
          uri: `/${project?.key}/in-store/key=${storeKey}/products/${productId}/product-tailoring`,
          payload: {
            version: productTailoring.version,
            actions: updateActions,
          },
        })
      );
      return result;
    },
    [project?.key, dispatchProductTailoringUpdate, storeKey]
  );

  const getProductProjectionFromIDs = useCallback(
    async (productIds: string[]) => {
      if (!productIds.length) {
        return {} as ProductProjectionPagedQueryResponse;
      }
      const where = `id in (${productIds.map((id) => `"${id}"`).join(', ')})`;
      const result = await dispatchProductProjection(
        actions.get({
          mcApiProxyTarget: MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM,
          uri: `/${project?.key}/product-projections?where=${where}`,
        })
      );
      return result;
    },
    [dataLocale, dispatchProductProjection, project?.key]
  );

  const executeProductSearchQuery = useCallback(
    async ({
      includeProductSelectionId,
      excludeProductSelectionId,
      limit = 20,
      offset = 0,
      locale = dataLocale,
      searchText = '',
    }: {
      includeProductSelectionId: string;
      excludeProductSelectionId?: string;
      limit?: number;
      offset?: number;
      locale?: string;
      searchText?: string;
    }) => {
      try {
        const result = await dispatchProductSearch(
          actions.post({
            mcApiProxyTarget: MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM,
            uri: `/${project?.key}/products/search`,
            payload: {
              query: buildSearchQuery(
                includeProductSelectionId,
                excludeProductSelectionId,
                searchText,
                locale
              ),
              productProjectionParameters: {},
              limit,
              offset,
              locale,
            },
          })
        );

        return result;
      } catch (error: any) {
        console.warn(`Failed to execute graphql query: ${error.message}`);
        return null;
      }
    },
    [project?.key, dispatchProductSearch]
  );

  const { refetch: getProductSelectionById } = useMcQuery(
    GET_PRODUCT_SELECTION_BY_ID,
    {
      variables: {
        id: 'placeholder', // Will be overridden
      },
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
      skip: true, // Skip initial query, we'll trigger it manually
    }
  );

  const [updateProductSelection] = useMcMutation(
    UPDATE_PRODUCT_SELECTION_MUTATION,
    {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
    }
  );

  const fetchStoreProducts = useCallback(
    async (
      includeProductSelectionId: string,
      excludeProductSelectionId?: string
    ): Promise<ProductSearchResult> => {
      setLoading(true);
      setError(null);

      try {
        logger.info(
          `Fetching products for product selection: ${productSelectionId}`
        );
        const data = await executeProductSearchQuery({
          includeProductSelectionId,
          excludeProductSelectionId,
          limit: perPage?.value,
          offset: ((page?.value || 1) - 1) * (perPage?.value || 20),
          locale: dataLocale,
        });

        if (data?.results && Array.isArray(data.results)) {
          const products = data.results.map((item, index) =>
            mapProductSearchResponse(item, index, dataLocale)
          );

          logger.info(
            `Successfully fetched ${products.length} products for product selection ${productSelectionId}`
          );
          return {
            total: data.total,
            offset: data.offset,
            limit: data.limit,
            results: products,
          };
        }

        logger.info(
          `No products found for product selection ${productSelectionId}`
        );
        return {
          total: 0,
          offset: 0,
          limit: 0,
          results: [],
        };
      } catch (err) {
        logger.error(
          `Error fetching products for product selection ${productSelectionId}:`,
          err
        );
        setError(
          err instanceof Error
            ? err
            : new Error(
                `Unknown error loading products for product selection ${productSelectionId}`
              )
        );
        return {
          total: 0,
          offset: 0,
          limit: 0,
          results: [],
        };
      } finally {
        setLoading(false);
      }
    },
    [dataLocale, executeProductSearchQuery, perPage?.value, page?.value]
  );

  const addProductsToStore = useCallback(
    async (productIds: string[]): Promise<boolean> => {
      if (!productIds.length) {
        logger.warn('No products selected to add');
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        // Step 1: Get the product selection ID and version
        const { data: selectionData } = (await getProductSelectionById({
          id: productSelectionId,
        })) as { data: ProductSelectionResponse };

        if (!selectionData?.productSelection?.id) {
          throw new Error(
            `Product selection for product selection ${productSelectionId} not found`
          );
        }

        const selectionId = productSelectionId;
        const version = selectionData.productSelection.version;

        logger.info(
          `Found product selection: ${selectionId} (version ${version})`
        );

        // Step 2: Create actions to add each product
        const actions = productIds.map((productId) => ({
          addProduct: {
            product: {
              id: productId,
            },
          },
        }));

        // Step 3: Execute the mutation to update the product selection
        const result = await updateProductSelection({
          variables: {
            id: selectionId,
            version,
            actions,
          },
        });

        // Update cache when products are added to store
        if (productSelectionId) {
          try {
            // We need to fetch the product data to add to cache
            const productDataResponse = await getProductProjectionFromIDs(
              productIds
            );

            if (productDataResponse?.results) {
              const addedProducts = productDataResponse.results.map(
                (item, index: number) =>
                  mapProdutProjectionResponse(item, index, dataLocale)
              );

              console.log('Added addedProducts', addedProducts);
              if (addedProducts.length > 0) {
                addProductsToCache(
                  PRODUCTS_FROM_MASTER_TO_STORE_KEY,
                  productSelectionId,
                  addedProducts
                );
                logger.info(
                  `Added ${addedProducts.length} products to master-to-store cache`
                );
              }
            }
          } catch (cacheError) {
            logger.warn(
              'Failed to update cache after adding products:',
              cacheError
            );
          }
        }

        logger.info('Product selection updated successfully:', result);
        return true;
      } catch (err) {
        logger.error(
          `Error adding products to product selection ${productSelectionId}:`,
          err
        );
        setError(
          err instanceof Error
            ? err
            : new Error(
                `Unknown error adding products to product selection ${productSelectionId}`
              )
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [getProductSelectionById, updateProductSelection, productSelectionId]
  );

  const removeProductsFromStore = useCallback(
    async (productIds: string[]): Promise<boolean> => {
      if (!productIds.length) {
        logger.warn('No products selected to remove');
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        logger.info(
          `Removing ${productIds.length} products from product selection ${productSelectionId}`
        );

        // Step 1: Get the product selection ID and version
        const { data: selectionData } = (await getProductSelectionById({
          id: productSelectionId,
        })) as { data: ProductSelectionResponse };

        if (!selectionData?.productSelection?.id) {
          throw new Error(
            `Product selection for product selection ${productSelectionId} not found`
          );
        }

        const selectionId = selectionData.productSelection.id;
        const version = selectionData.productSelection.version;

        logger.info(
          `Found product selection: ${selectionId} (version ${version})`
        );

        // Step 2: Create actions to remove each product
        const actions = productIds.map((productId) => ({
          removeProduct: {
            product: {
              id: productId,
            },
          },
        }));

        // Step 3: Execute the mutation to update the product selection
        const result = await updateProductSelection({
          variables: {
            id: selectionId,
            version,
            actions,
          },
        });

        // Update cache when products are removed from store
        if (productSelectionId && masterProductSelectionId) {
          try {
            // Remove from master-to-store cache
            removeProductsFromCache(
              PRODUCTS_FROM_MASTER_TO_STORE_KEY,
              productSelectionId,
              productIds
            );

            // Get the removed product data to add to store-to-master cache
            const productDataResponse = await getProductProjectionFromIDs(
              productIds
            );

            if (productDataResponse?.results) {
              const removedProducts = productDataResponse.results.map(
                (item, index: number) =>
                  mapProdutProjectionResponse(item, index, dataLocale)
              );

              if (removedProducts.length > 0) {
                addProductsToCache(
                  PRODUCTS_FROM_STORE_TO_MASTER_KEY,
                  masterProductSelectionId,
                  removedProducts
                );
                logger.info(
                  `Added ${removedProducts.length} products to store-to-master cache`
                );
              }
            }
          } catch (cacheError) {
            logger.warn(
              'Failed to update cache after removing products:',
              cacheError
            );
          }
        }

        logger.info('Products successfully removed from selection:', result);
        return true;
      } catch (err) {
        logger.error(
          `Error removing products from product selection ${productSelectionId}:`,
          err
        );
        setError(
          err instanceof Error
            ? err
            : new Error(
                `Unknown error removing products from product selection ${productSelectionId}`
              )
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [getProductSelectionById, updateProductSelection, productSelectionId]
  );

  // Function to create a new product
  const createProduct = async (productDraft: ProductDraft) => {
    setLoading(true);
    setError(null);

    try {
      logger.info(
        'Creating product with data:',
        JSON.stringify(productDraft, null, 2)
      );

      // Step 1: Create the product using the GraphQL mutation
      const result = await dispatchProductCreate(
        actions.post({
          mcApiProxyTarget: MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM,
          uri: `/${project?.key}/products`,
          payload: productDraft,
        })
      ).catch((error) => {
        // Extract GraphQL specific error details
        const graphqlErrors = error.graphQLErrors || [];

        if (graphqlErrors.length > 0) {
          const errorDetails = graphqlErrors
            .map((err: any) => {
              logger.error(
                'GraphQL error details:',
                JSON.stringify(err, null, 2)
              );
              return `${err.message}${
                err.extensions?.code ? ` (${err.extensions.code})` : ''
              }`;
            })
            .join('\n');
          logger.error('GraphQL errors:', errorDetails);
          throw new Error(`Failed to create product: ${errorDetails}`);
        } else if (error.networkError) {
          logger.error('Network error:', error.networkError);
          throw new Error(
            'Network error when creating product. Please try again.'
          );
        } else {
          logger.error('Unexpected error:', error);
          throw error;
        }
      });

      // Type assertion to handle TypeScript type safety
      const data = result as Product;

      if (!data?.id) {
        throw new Error('Failed to create product: No product ID returned');
      }

      const productId = data.id;
      logger.info('Product created successfully with ID:', productId);

      await addProductsToStore([productId]);

      return true;
    } catch (err) {
      logger.error('Error creating product:', err);
      setError(
        err instanceof Error ? err : new Error('Unknown error creating product')
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  const searchProductsFunc = useCallback(
    async (
      includeProductSelectionId: string,
      searchText: string
    ): Promise<ProductSearchResult> => {
      setLoading(true);
      setError(null);

      try {
        logger.info(`Searching products with text: "${searchText}"`);
        const response = await executeProductSearchQuery({
          includeProductSelectionId,
          limit: perPage?.value,
          offset: ((page?.value || 1) - 1) * (perPage?.value || 20),
          locale: dataLocale,
          searchText,
        });

        // Log the raw response for debugging
        logger.info(
          'Raw search response data structure:',
          JSON.stringify(response?.results?.[0] || {}, null, 2)
        );

        if (response?.results && Array.isArray(response.results)) {
          logger.info(`Search found ${response.results.length} products`);

          const products = response.results.map((item, index: number) =>
            mapProductSearchResponse(item, index, dataLocale)
          );

          return {
            total: response.total,
            offset: response.offset,
            limit: response.limit,
            results: products,
          };
        }

        logger.info('No products found in search');
        return {
          total: 0,
          offset: 0,
          limit: 0,
          results: [],
        };
      } catch (err) {
        logger.error(`Error searching products:`, err);
        setError(
          err instanceof Error
            ? err
            : new Error(`Unknown error searching products`)
        );
        return {
          total: 0,
          offset: 0,
          limit: 0,
          results: [],
        };
      } finally {
        setLoading(false);
      }
    },
    [executeProductSearchQuery]
  );

  const fetchUserStoreProducts =
    useCallback(async (): Promise<ProductSearchResult> => {
      if (!productSelectionId || !masterProductSelectionId) {
        console.warn('Product selection ID is required');
        return {
          total: 0,
          offset: 0,
          limit: 0,
          results: [],
        };
      }

      try {
        const result = await fetchStoreProducts(productSelectionId);

        // Merge with cached products from master-to-store
        const mergedResults = mergeCacheWithResults(
          result.results,
          PRODUCTS_FROM_STORE_TO_MASTER_KEY,
          PRODUCTS_FROM_MASTER_TO_STORE_KEY,
          productSelectionId,
          masterProductSelectionId
        );

        if (mergedResults.length > 0) {
          return {
            ...result,
            total:
              result.total + (mergedResults.length - result.results.length),
            results: mergedResults,
          };
        }

        return result;
      } catch (error) {
        logger.error('Error in fetchUserStoreProducts:', error);
        throw error;
      }
    }, [fetchStoreProducts, productSelectionId]);

  const fetchMasterStoreProducts =
    useCallback(async (): Promise<ProductSearchResult> => {
      if (!masterProductSelectionId || !productSelectionId) {
        console.warn('Product selection ID is required');
        return {
          total: 0,
          offset: 0,
          limit: 0,
          results: [],
        };
      }

      try {
        const result = await fetchStoreProducts(
          masterProductSelectionId,
          productSelectionId
        );

        const mergedResults = mergeCacheWithResults(
          result.results,
          PRODUCTS_FROM_MASTER_TO_STORE_KEY,
          PRODUCTS_FROM_STORE_TO_MASTER_KEY,
          masterProductSelectionId,
          productSelectionId
        );

        if (mergedResults.length > 0) {
          return {
            ...result,
            total:
              result.total + (mergedResults.length - result.results.length),
            results: mergedResults,
          };
        }

        return result;
      } catch (error) {
        logger.error('Error in fetchMasterStoreProducts:', error);
        throw error;
      }
    }, [fetchStoreProducts, masterProductSelectionId, productSelectionId]);

  const searchStoreProducts = useCallback(
    async (searchText: string): Promise<ProductSearchResult> => {
      if (!productSelectionId || !masterProductSelectionId) {
        console.warn('Product selection ID is required');
        return {
          total: 0,
          offset: 0,
          limit: 0,
          results: [],
        };
      }

      try {
        const result = await searchProductsFunc(productSelectionId, searchText);

        // Merge with cached products from master-to-store
        const mergedResults = mergeCacheWithResults(
          result.results,
          PRODUCTS_FROM_STORE_TO_MASTER_KEY,
          PRODUCTS_FROM_MASTER_TO_STORE_KEY,
          productSelectionId,
          masterProductSelectionId
        );

        if (mergedResults.length > 0) {
          return {
            ...result,
            total:
              result.total + (mergedResults.length - result.results.length),
            results: mergedResults,
          };
        }

        return result;
      } catch (error) {
        logger.error('Error in searchStoreProducts:', error);
        throw error;
      }
    },
    [searchProductsFunc, productSelectionId]
  );

  const searchMasterProducts = useCallback(
    async (searchText: string): Promise<ProductSearchResult> => {
      if (!masterProductSelectionId || !productSelectionId) {
        console.warn('Product selection ID is required');
        return {
          total: 0,
          offset: 0,
          limit: 0,
          results: [],
        };
      }

      try {
        const result = await searchProductsFunc(
          masterProductSelectionId,
          searchText
        );

        // Merge with cached products from store-to-master
        const mergedResults = mergeCacheWithResults(
          result.results,
          PRODUCTS_FROM_MASTER_TO_STORE_KEY,
          PRODUCTS_FROM_STORE_TO_MASTER_KEY,
          masterProductSelectionId,
          productSelectionId
        );

        if (mergedResults.length > 0) {
          return {
            ...result,
            total:
              result.total + (mergedResults.length - result.results.length),
            results: mergedResults,
          };
        }

        return result;
      } catch (error) {
        logger.error('Error in searchMasterProducts:', error);
        throw error;
      }
    },
    [searchProductsFunc, masterProductSelectionId, productSelectionId]
  );

  return {
    executeProductSearchQuery,
    fetchUserStoreProducts,
    fetchMasterStoreProducts,
    addProductsToStore,
    removeProductsFromStore,
    createProduct,
    searchStoreProducts,
    searchMasterProducts,
    getProductById,
    getProductTailoringInStore,
    createProductTailoring,
    updateProductTailoring,
    loading,
    error,
  };
};

export default useStoreProducts;
