import { useCallback, useState } from 'react';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import {
  useMcQuery,
  useMcMutation,
} from '@commercetools-frontend/application-shell';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import gql from 'graphql-tag';
import logger from '../../../utils/logger';
import useStoreProducts from '../use-store-products/use-store-products';
import { TState } from '@commercetools-uikit/hooks';
import { useAuthContext } from '../../contexts/auth-context';
import { Price } from '@commercetools/platform-sdk';

// Constants
const DEFAULT_CURRENCY_CODE = 'USD';
const DEFAULT_COUNTRY_CODE = 'US';

// GraphQL query to get product details including all prices
const GET_PRODUCT_PRICES = gql`
  query GetProductPrices($id: String!) {
    product(id: $id) {
      id
      version
      masterData {
        current {
          masterVariant {
            prices {
              id
              value {
                centAmount
                currencyCode
              }
              channel {
                id
                key
              }
            }
          }
        }
        staged {
          masterVariant {
            prices {
              id
              value {
                centAmount
                currencyCode
              }
              channel {
                id
                key
              }
            }
          }
        }
      }
    }
  }
`;

// GraphQL mutation to update product prices
const UPDATE_PRODUCT_PRICE = gql`
  mutation UpdateProductPrice(
    $id: String!
    $version: Long!
    $actions: [ProductUpdateAction!]!
  ) {
    updateProduct(id: $id, version: $version, actions: $actions) {
      id
      version
    }
  }
`;

interface ProductVariant {
  images: Array<{ url: string }>;
  sku: string;
  prices?: Price[];
}

interface ProductDataVersion {
  masterVariant: ProductVariant;
  name?: string;
}

interface ProductMasterData {
  current: ProductDataVersion;
  staged?: ProductDataVersion;
}

interface Product {
  id: string;
  version: number;
  masterData: ProductMasterData;
}

interface GetProductPricesResponse {
  product: Product;
}

// Product type definition with price information
interface ProductPriceData {
  id: string;
  name: string;
  image: string;
  sku: string;
  version: number;
  currentPrice?: {
    id: string;
    value: number;
    currencyCode: string;
  };
  masterPrice?: {
    id: string;
    value: number;
    currencyCode: string;
  };
}

interface PagedProductPriceData {
  results: ProductPriceData[];
  total: number;
  offset: number;
  count: number;
}

// Define the hook interface
interface UsePriceManagementResult {
  fetchProductsWithPrices: (
    searchText?: string
  ) => Promise<PagedProductPriceData>;
  updateProductPrice: (
    productId: string,
    version: number,
    price: number,
    channelKey: string,
    priceId?: string
  ) => Promise<boolean>;
  loading: boolean;
  error: Error | null;
}

/**
 * Helper function to find a price by channel key and currency code
 */
const findPriceByChannelId = (
  current: Price[] | undefined,
  channelId: string | null,
  currencyCode: string = DEFAULT_CURRENCY_CODE
): Price | undefined => {
  // Look in current prices first
  const currentPrice = current?.find(
    (p) => p.channel?.id === channelId && p.value.currencyCode === currencyCode
  );
  return currentPrice;
};

/**
 * Price management hook for fetching and updating product prices
 */
const usePriceManagement = ({
  page,
  perPage,
}: {
  page?: TState;
  perPage?: TState;
}): UsePriceManagementResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { executeProductSearchQuery } = useStoreProducts({});
  const {
    productSelectionId,
    masterDistributionChannelId,
    distributionChannelId,
  } = useAuthContext();
  const { dataLocale } = useApplicationContext((context) => ({
    dataLocale: context.dataLocale ?? 'en-US',
  }));

  // Helper function for error handling
  const handleError = (err: unknown, defaultMessage: string): Error => {
    const errorObj = err instanceof Error ? err : new Error(defaultMessage);
    logger.error(defaultMessage, err);

    // Log additional details for Apollo errors
    if (err instanceof Error) {
      const anyErr = err as any;
      if (anyErr.graphQLErrors) {
        logger.error('GraphQL Errors:', JSON.stringify(anyErr.graphQLErrors));
      }
      if (anyErr.networkError) {
        logger.error('Network Error:', anyErr.networkError);
      }
    }

    return errorObj;
  };

  const { refetch: getProductPrices } = useMcQuery<GetProductPricesResponse>(
    GET_PRODUCT_PRICES,
    {
      variables: {
        id: 'placeholder', // This will be overridden in updateProductPrice
      },
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
      skip: true, // Skip initial query, we'll trigger it manually
    }
  );

  const [updateProduct] = useMcMutation(UPDATE_PRODUCT_PRICE, {
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
  });

  /**
   * Fetches products with their prices for a specific store
   */
  const fetchProductsWithPrices = useCallback(
    async (searchText?: string): Promise<PagedProductPriceData> => {
      setLoading(true);
      setError(null);

      if (!productSelectionId) {
        throw new Error('Product selection ID is not set');
      }

      try {
        logger.info(
          `Fetching products with prices for channel: ${distributionChannelId}`
        );
        const data = await executeProductSearchQuery({
          includeProductSelectionId: productSelectionId,
          limit: perPage?.value,
          offset: ((page?.value || 1) - 1) * (perPage?.value || 20),
          locale: dataLocale,
          ...(searchText && { searchText }),
        });

        if (data?.results && Array.isArray(data.results)) {
          const products = data.results.map((item) => {
            const product = item.productProjection;
            const currentMasterVariant = product?.masterVariant;

            // Find store price using helper function
            const storePrice = findPriceByChannelId(
              currentMasterVariant?.prices,
              distributionChannelId
            );

            // Find master store price using helper function
            const masterStorePrice = findPriceByChannelId(
              currentMasterVariant?.prices,
              masterDistributionChannelId
            );

            return {
              id: item.id,
              name: product?.name[dataLocale] || 'Unnamed product',
              version: product?.version || 0,
              image:
                currentMasterVariant?.images?.[0]?.url ||
                'https://via.placeholder.com/80',
              sku: currentMasterVariant?.sku || 'No SKU',
              currentPrice: storePrice
                ? {
                    id: storePrice.id,
                    value: storePrice.value.centAmount / 100, // Convert cents to dollars
                    currencyCode: storePrice.value.currencyCode,
                  }
                : undefined,
              masterPrice: masterStorePrice
                ? {
                    id: masterStorePrice.id,
                    value: masterStorePrice.value.centAmount / 100, // Convert cents to dollars
                    currencyCode: masterStorePrice.value.currencyCode,
                  }
                : undefined,
            };
          });

          logger.info(
            `Successfully fetched ${products.length} products with prices for store ${distributionChannelId}`
          );
          return {
            results: products,
            total: data.total,
            offset: data.offset,
            count: data.total,
          };
        }

        logger.info(`No products found for store ${distributionChannelId}`);
        return {
          results: [],
          total: 0,
          offset: 0,
          count: 0,
        };
      } catch (err) {
        const error = handleError(
          err,
          `Error fetching products with prices for store ${distributionChannelId}`
        );
        setError(error);
        return {
          results: [],
          total: 0,
          offset: 0,
          count: 0,
        };
      } finally {
        setLoading(false);
      }
    },
    [
      productSelectionId,
      executeProductSearchQuery,
      perPage?.value,
      page?.value,
      distributionChannelId,
      masterDistributionChannelId,
      dataLocale,
    ]
  );

  /**
   * Updates a product price for a specific channel
   */
  const updateProductPrice = useCallback(
    async (
      productId: string,
      version: number,
      price: number,
      channelKey: string,
      priceId?: string
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        logger.info(
          `Updating price for product ${productId} with channel ${channelKey}`
        );

        // Get the latest product data and version
        const { data } = await getProductPrices({
          id: productId,
        });

        if (!data || !data.product) {
          throw new Error(`Could not fetch product data for ID ${productId}`);
        }

        // Use the latest version from the server
        let latestVersion = data.product.version;
        logger.info(`Initial product version: ${latestVersion}`);

        // Check both current and staged variants for existing prices
        const currentPrices =
          data.product.masterData.current.masterVariant.prices || [];

        // Find existing price ID if not provided
        let existingPriceId = priceId;

        if (!existingPriceId) {
          const existingPrice = findPriceByChannelId(currentPrices, channelKey);

          if (existingPrice) {
            existingPriceId = existingPrice.id;
            logger.info(
              `Found existing price with ID ${existingPriceId} for channel ${channelKey}`
            );
          }
        }

        // Convert price to cents
        const priceInCents = Math.round(price * 100);
        const actions = [];

        // Create actions based on whether we're updating or creating
        if (existingPriceId) {
          // Change existing price - more efficient than remove + add
          actions.push({
            changePrice: {
              priceId: existingPriceId,
              price: {
                value: {
                  centPrecision: {
                    centAmount: priceInCents,
                    currencyCode: DEFAULT_CURRENCY_CODE,
                  },
                },
                country: DEFAULT_COUNTRY_CODE,
                channel: {
                  typeId: 'channel',
                  key: channelKey,
                },
              },
            },
          });
          logger.info(
            `Updating existing price ID ${existingPriceId} to ${priceInCents} cents`
          );
        } else {
          // Add new price
          actions.push({
            addPrice: {
              variantId: 1, // Master variant
              price: {
                value: {
                  centPrecision: {
                    centAmount: priceInCents,
                    currencyCode: DEFAULT_CURRENCY_CODE,
                  },
                },
                country: DEFAULT_COUNTRY_CODE,
                channel: {
                  typeId: 'channel',
                  key: channelKey,
                },
              },
            },
          });
          logger.info(
            `Adding new price of ${priceInCents} cents for channel ${channelKey}`
          );
        }

        // Add publish action to apply changes
        actions.push({
          publish: {
            scope: 'All',
          },
        });

        // Execute the mutation to update the price
        const result = await updateProduct({
          variables: {
            id: productId,
            version: latestVersion,
            actions: actions,
          },
        });

        logger.info('Product price updated successfully:', result);
        return true;
      } catch (err) {
        const error = handleError(
          err,
          `Error updating price for product ${productId}`
        );
        setError(error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [updateProduct, getProductPrices]
  );

  return {
    fetchProductsWithPrices,
    updateProductPrice,
    loading,
    error,
  };
};

export default usePriceManagement;
