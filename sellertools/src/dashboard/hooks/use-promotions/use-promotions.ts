import { useCallback, useState } from 'react';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import {
  useMcQuery,
  useMcMutation,
} from '@commercetools-frontend/application-shell';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import gql from 'graphql-tag';

// GraphQL query to fetch product discounts
const GET_PRODUCT_DISCOUNTS_QUERY = gql`
  query GetProductDiscounts {
    productDiscounts {
      results {
        id
        version
        createdAt
        lastModifiedAt
        isActive
        name(locale: "en-US")
        description(locale: "en-US")
        predicate
        validFrom
        validUntil
        sortOrder
        key
        value {
          ... on RelativeDiscountValue {
            __typename
            permyriad
            type
          }
          ... on AbsoluteDiscountValue {
            __typename
            money {
              centAmount
              currencyCode
              fractionDigits
              type
            }
            type
          }
        }
      }
    }
  }
`;

// GraphQL query to fetch a single product discount by ID
const GET_PRODUCT_DISCOUNT_BY_ID_QUERY = gql`
  query GetProductDiscountById($id: String!) {
    productDiscount(id: $id) {
      id
      version
      createdAt
      lastModifiedAt
      isActive
      name(locale: "en-US")
      description(locale: "en-US")
      predicate
      validFrom
      validUntil
      sortOrder
      key
      value {
        ... on RelativeDiscountValue {
          __typename
          permyriad
          type
        }
        ... on AbsoluteDiscountValue {
          __typename
          money {
            centAmount
            currencyCode
            fractionDigits
            type
          }
          type
        }
      }
    }
  }
`;

// GraphQL mutation to create a new product discount
const CREATE_PRODUCT_DISCOUNT_MUTATION = gql`
  mutation CreateProductDiscount($draft: ProductDiscountDraft!) {
    createProductDiscount(draft: $draft) {
      id
      version
      createdAt
      lastModifiedAt
      name(locale: "en-US")
      description(locale: "en-US")
      isActive
      predicate
      validFrom
      validUntil
      sortOrder
      value {
        ... on RelativeDiscountValue {
          __typename
          permyriad
          type
        }
        ... on AbsoluteDiscountValue {
          __typename
          money {
            centAmount
            currencyCode
            fractionDigits
            type
          }
          type
        }
      }
    }
  }
`;

// GraphQL mutation to update a product discount's active status
const UPDATE_PRODUCT_DISCOUNT_ACTIVE_STATUS_MUTATION = gql`
  mutation UpdateProductDiscountActiveStatus(
    $id: String!
    $version: Long!
    $actions: [ProductDiscountUpdateAction!]!
  ) {
    updateProductDiscount(id: $id, version: $version, actions: $actions) {
      id
      version
      isActive
    }
  }
`;

// GraphQL mutation to update a product discount (beyond just active status)
const UPDATE_PRODUCT_DISCOUNT_MUTATION = gql`
  mutation UpdateProductDiscount(
    $id: String!
    $version: Long!
    $actions: [ProductDiscountUpdateAction!]!
  ) {
    updateProductDiscount(id: $id, version: $version, actions: $actions) {
      id
      version
      createdAt
      lastModifiedAt
      name(locale: "en-US")
      description(locale: "en-US")
      isActive
      predicate
      validFrom
      validUntil
      sortOrder
      value {
        ... on RelativeDiscountValue {
          __typename
          permyriad
          type
        }
        ... on AbsoluteDiscountValue {
          __typename
          money {
            centAmount
            currencyCode
            fractionDigits
            type
          }
          type
        }
      }
    }
  }
`;

// GraphQL mutation to delete a product discount
const DELETE_PRODUCT_DISCOUNT_MUTATION = gql`
  mutation DeleteProductDiscount($id: String!, $version: Long!) {
    deleteProductDiscount(id: $id, version: $version) {
      id
    }
  }
`;

// Define the interface for the promotion data structure - export for use in other components
export interface PromotionData {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  predicate: string;
  channelKey: string | null; // Added field to store extracted channel key
  valueAmount: string;
  sortOrder: string;
  key: string | null;
  version: number; // Add version for updates
}

// Define the interface for creating a new product discount
interface CreateProductDiscountInput {
  name: string;
  description?: string;
  channelKey: string;
  predicate: string;
  discountValue: number;
  discountType: 'percentage' | 'absolute';
  // For percentage discounts, value is in % (e.g., 10 for 10%)
  // For absolute discounts, value is in cents (e.g., 1000 for $10.00)
  currencyCode?: string; // Required for absolute discounts
  isActive?: boolean;
  sortOrder?: string;
  key?: string;
}

// Define the interface for updating a product discount's active status
interface UpdateProductDiscountActiveStatusInput {
  id: string;
  version: number;
  isActive: boolean;
}

// Define the interface for updating a product discount (full update, not just active status)
interface UpdateProductDiscountInput {
  id: string;
  version: number;
  name: string;
  description?: string;
  channelKey: string;
  predicate: string;
  discountValue: number;
  discountType: 'percentage' | 'absolute';
  currencyCode?: string;
  isActive?: boolean;
  sortOrder?: string;
}

// Define interface for deleting a product discount
interface DeleteProductDiscountInput {
  id: string;
  version: number;
}

// GraphQL response types
interface ProductDiscountResult {
  id: string;
  isActive: boolean;
  name: string;
  description?: string;
  predicate: string;
  value: {
    __typename: string;
    type: string;
    money?: Array<{
      centAmount: number;
      currencyCode: string;
    }>;
    permyriad?: number;
  };
  sortOrder: string;
  key: string | null;
  version: number;
}

interface ProductDiscountsResponse {
  results: ProductDiscountResult[];
}

interface PromotionsQueryResult {
  productDiscounts: ProductDiscountsResponse;
}

interface QueryResponse {
  data: PromotionsQueryResult;
}

// Create product discount response
interface CreateProductDiscountResult {
  createProductDiscount: ProductDiscountResult;
}

// Define interface for the mutation response
interface UpdateProductDiscountResult {
  updateProductDiscount: {
    id: string;
    version: number;
    isActive: boolean;
  };
}

// Define interface for the delete mutation response
interface DeleteProductDiscountResult {
  deleteProductDiscount: {
    id: string;
  };
}

// Interface for the get promotion by ID response
interface GetProductDiscountByIdResult {
  productDiscount: ProductDiscountResult;
}

// Define the hook result interface
interface UsePromotionsResult {
  fetchPromotions: (channelKey: string) => Promise<PromotionData[]>;
  getPromotionById: (id: string) => Promise<PromotionData | null>;
  createProductDiscount: (
    input: CreateProductDiscountInput
  ) => Promise<ProductDiscountResult | null>;
  updatePromotionActiveStatus: (
    input: UpdateProductDiscountActiveStatusInput
  ) => Promise<boolean>;
  updateProductDiscount: (
    input: UpdateProductDiscountInput
  ) => Promise<ProductDiscountResult | null>;
  deleteProductDiscount: (
    input: DeleteProductDiscountInput
  ) => Promise<boolean>;
  loading: boolean;
  error: Error | null;
}

const usePromotions = (): UsePromotionsResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { dataLocale } = useApplicationContext();

  const { refetch } = useMcQuery<PromotionsQueryResult>(
    GET_PRODUCT_DISCOUNTS_QUERY,
    {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
      skip: true, // Skip initial query, we'll trigger it manually
    }
  );

  const { refetch: fetchProductDiscountById } =
    useMcQuery<GetProductDiscountByIdResult>(GET_PRODUCT_DISCOUNT_BY_ID_QUERY, {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
      skip: true,
    });

  const [runCreateMutation] = useMcMutation<CreateProductDiscountResult>(
    CREATE_PRODUCT_DISCOUNT_MUTATION,
    {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
    }
  );

  const [runUpdateActiveMutation] = useMcMutation(
    UPDATE_PRODUCT_DISCOUNT_ACTIVE_STATUS_MUTATION,
    {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
    }
  );

  const [runUpdateMutation] = useMcMutation<{
    updateProductDiscount: ProductDiscountResult;
  }>(UPDATE_PRODUCT_DISCOUNT_MUTATION, {
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
  });

  const [runDeleteMutation] = useMcMutation<DeleteProductDiscountResult>(
    DELETE_PRODUCT_DISCOUNT_MUTATION,
    {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
    }
  );

  // Extract channel key from predicate
  const extractChannelKey = (predicate: string): string | null => {
    // Handle empty predicate
    if (!predicate) {
      return null;
    }

    // Try to match channel.key = "key" pattern
    const match = predicate.match(/channel\.key\s*=\s*["']([^"']+)["']/);
    if (match && match[1]) {
      return match[1];
    }

    // Try to match other potential patterns
    const altMatch = predicate.match(
      /channel\s*\(\s*key\s*=\s*["']([^"']+)["']\s*\)/
    );
    if (altMatch && altMatch[1]) {
      return altMatch[1];
    }

    return null;
  };

  const fetchPromotions = useCallback(
    async (channelKey: string): Promise<PromotionData[]> => {
      setLoading(true);
      setError(null);

      try {
        console.log(`Fetching product discounts`);
        const response = await refetch();

        // Safely access data with optional chaining
        const results = response?.data?.productDiscounts?.results || [];

        if (results.length > 0) {
          // Filter results to only include those with a matching channel key
          const filteredResults = results.filter(
            (item: ProductDiscountResult) => {
              const itemChannelKey = extractChannelKey(item.predicate);
              return itemChannelKey === channelKey;
            }
          );

          const promotions = filteredResults.map(
            (item: ProductDiscountResult) => {
              // Process discount value information
              let valueAmount = '';

              if (item.value) {
                if (item.value.__typename === 'AbsoluteDiscountValue') {
                  if (item.value.money && item.value.money.length > 0) {
                    const { centAmount, currencyCode } = item.value.money[0];
                    valueAmount = formatCurrency(centAmount, currencyCode);
                  }
                } else if (item.value.__typename === 'RelativeDiscountValue') {
                  if (item.value.permyriad !== undefined) {
                    valueAmount = formatPercentage(item.value.permyriad);
                  }
                }
              }

              return {
                id: item.id,
                name: item.name || 'Unnamed Promotion',
                description: item.description || '',
                isActive: item.isActive || false,
                predicate: item.predicate || 'No conditions',
                channelKey: extractChannelKey(item.predicate),
                valueAmount,
                sortOrder: item.sortOrder || '0',
                key: item.key,
                version: item.version || 1, // Add version to the mapped results
              };
            }
          );

          console.log(
            `Successfully processed ${promotions.length} product discounts for channel ${channelKey}`
          );
          return promotions;
        }

        return [];
      } catch (err) {
        console.error('Error fetching product discounts:', err);
        setError(
          err instanceof Error ? err : new Error('Unknown error occurred')
        );
        return [];
      } finally {
        setLoading(false);
      }
    },
    [refetch]
  );

  const getPromotionById = useCallback(
    async (id: string): Promise<PromotionData | null> => {
      setLoading(true);
      setError(null);

      try {
        console.log(`Fetching product discount with ID: ${id}`);
        const response = await fetchProductDiscountById({
          id,
        });

        // Safely access data with optional chaining
        const productDiscount = response?.data?.productDiscount;

        if (!productDiscount) {
          console.log(`No product discount found with ID: ${id}`);
          return null;
        }

        // Process discount value information
        let valueAmount = '';

        if (productDiscount.value) {
          if (productDiscount.value.__typename === 'AbsoluteDiscountValue') {
            if (
              productDiscount.value.money &&
              productDiscount.value.money.length > 0
            ) {
              const { centAmount, currencyCode } =
                productDiscount.value.money[0];
              valueAmount = formatCurrency(centAmount, currencyCode);
            }
          } else if (
            productDiscount.value.__typename === 'RelativeDiscountValue'
          ) {
            if (productDiscount.value.permyriad !== undefined) {
              valueAmount = formatPercentage(productDiscount.value.permyriad);
            }
          }
        }

        // Map to our promotion data structure
        const promotion: PromotionData = {
          id: productDiscount.id,
          name: productDiscount.name || 'Unnamed Promotion',
          description: productDiscount.description || '',
          isActive: productDiscount.isActive || false,
          predicate: productDiscount.predicate || 'No conditions',
          channelKey: extractChannelKey(productDiscount.predicate),
          valueAmount,
          sortOrder: productDiscount.sortOrder || '0',
          key: productDiscount.key,
          version: productDiscount.version || 1,
        };

        console.log(`Successfully fetched product discount with ID: ${id}`);
        return promotion;
      } catch (err) {
        console.error(`Error fetching product discount with ID ${id}:`, err);
        setError(
          err instanceof Error ? err : new Error('Unknown error occurred')
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchProductDiscountById]
  );

  const createProductDiscount = useCallback(
    async (
      input: CreateProductDiscountInput
    ): Promise<ProductDiscountResult | null> => {
      setLoading(true);
      setError(null);

      try {
        // Build the predicate that includes the channel key
        const predicate =
          input.predicate || `channel.key = "${input.channelKey}"`;

        // Format values according to the required GraphQL schema
        // For relative (percentage) discounts
        let value;
        if (input.discountType === 'percentage') {
          value = {
            relative: {
              permyriad: input.discountValue * 100, // Convert percentage to permyriad (e.g., 10% becomes 1000)
            },
          };
        } else {
          // For absolute discounts
          if (!input.currencyCode) {
            throw new Error('Currency code is required for absolute discounts');
          }

          value = {
            absolute: {
              money: [
                {
                  currencyCode: input.currencyCode,
                  centAmount: Math.round(input.discountValue * 100), // Convert dollars to cents
                },
              ],
            },
          };
        }

        // Build the draft object with the correct structure
        const draft = {
          name: [
            {
              locale: 'en-US', // Note the locale format must match what the API expects (en-US not en-us)
              value: input.name,
            },
          ],
          description: input.description
            ? [
                {
                  locale: 'en-US',
                  value: input.description,
                },
              ]
            : undefined,
          predicate,
          value,
          isActive: input.isActive !== undefined ? input.isActive : true,
          sortOrder: input.sortOrder || '0.5',
          key: input.key,
        };

        console.log('Product discount draft:', JSON.stringify(draft, null, 2));

        // Execute the mutation
        const response = await runCreateMutation({
          variables: {
            draft,
          },
        });

        return response.data?.createProductDiscount || null;
      } catch (error: unknown) {
        console.error('Error creating product discount:', error);

        // Log detailed error information for debugging
        const typedError = error as any;
        if (typedError.graphQLErrors) {
          console.error(
            'GraphQL errors:',
            JSON.stringify(typedError.graphQLErrors, null, 2)
          );
        }

        setError(
          error instanceof Error ? error : new Error('Unknown error occurred')
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [runCreateMutation]
  );

  const updatePromotionActiveStatus = async (
    input: UpdateProductDiscountActiveStatusInput
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { id, version, isActive } = input;

      // Structure the actions according to the correct format
      const actions = [
        {
          changeIsActive: {
            isActive,
          },
        },
      ];

      // Execute the mutation
      const result = await runUpdateActiveMutation({
        variables: {
          id,
          version, // Version should remain a number for Long! type
          actions,
        },
      });

      // Check if the mutation was successful and use type assertion
      const data = result?.data as
        | UpdateProductDiscountResult
        | null
        | undefined;
      if (data?.updateProductDiscount) {
        return true;
      }

      return false;
    } catch (error: unknown) {
      console.error('Error updating product discount active status:', error);

      // Log detailed error information for debugging
      const typedError = error as any;
      if (typedError.graphQLErrors) {
        console.error(
          'GraphQL errors:',
          JSON.stringify(typedError.graphQLErrors, null, 2)
        );
      }

      setError(
        error instanceof Error
          ? error
          : new Error('Failed to update promotion status')
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateProductDiscount = useCallback(
    async (
      input: UpdateProductDiscountInput
    ): Promise<ProductDiscountResult | null> => {
      setLoading(true);
      setError(null);

      try {
        const {
          id,
          version,
          name,
          description,
          predicate,
          discountValue,
          discountType,
          currencyCode,
          isActive,
          sortOrder,
        } = input;

        // First, fetch the current promotion to compare values
        // We'll use the query that already exists for fetching all promotions
        const response = await refetch();
        if (!response?.data?.productDiscounts?.results) {
          throw new Error('Failed to fetch current promotion data');
        }

        // Find the current promotion by ID
        const currentPromotion = response.data.productDiscounts.results.find(
          (p: ProductDiscountResult) => p.id === id
        );

        if (!currentPromotion) {
          throw new Error('Promotion not found');
        }

        // Build the actions array for updating the product discount
        const actions = [];

        // Set name - only if changed
        const currentName = currentPromotion.name || '';
        if (name !== currentName) {
          actions.push({
            changeName: {
              name: [
                {
                  locale: 'en-US',
                  value: name,
                },
              ],
            },
          });
        }

        // Set description - only if changed
        const currentDescription = currentPromotion.description || '';
        if (description !== currentDescription) {
          actions.push({
            setDescription: {
              description: description
                ? [
                    {
                      locale: 'en-US',
                      value: description,
                    },
                  ]
                : [],
            },
          });
        }

        // Set predicate - only if changed
        if (predicate !== currentPromotion.predicate) {
          actions.push({
            changePredicate: {
              predicate,
            },
          });
        }

        // Check if the discount value or type has changed
        // This requires more complex comparison as the data structures differ
        let valueChanged = false;

        if (discountType === 'percentage') {
          // Check if the current value is also a percentage and if the value has changed
          const currentPermyriad =
            currentPromotion.value?.__typename === 'RelativeDiscountValue'
              ? currentPromotion.value.permyriad
              : null;

          if (
            currentPromotion.value?.__typename !== 'RelativeDiscountValue' ||
            currentPermyriad === null ||
            currentPermyriad === undefined ||
            Math.abs((currentPermyriad || 0) / 100 - discountValue) > 0.001 // Account for floating point precision
          ) {
            valueChanged = true;
          }
        } else if (discountType === 'absolute' && currencyCode) {
          // Check if the current value is also absolute and in the same currency with the same amount
          const currentMoney =
            currentPromotion.value?.__typename === 'AbsoluteDiscountValue'
              ? currentPromotion.value.money?.find(
                  (m) => m.currencyCode === currencyCode
                )
              : null;

          const targetCentAmount = Math.round(discountValue * 100);
          if (
            currentPromotion.value?.__typename !== 'AbsoluteDiscountValue' ||
            !currentMoney ||
            currentMoney.centAmount !== targetCentAmount
          ) {
            valueChanged = true;
          }
        }

        // Add changeValue action if needed
        if (valueChanged) {
          if (discountType === 'percentage') {
            actions.push({
              changeValue: {
                value: {
                  relative: {
                    permyriad: discountValue * 100, // Convert percentage to permyriad
                  },
                },
              },
            });
          } else if (discountType === 'absolute' && currencyCode) {
            actions.push({
              changeValue: {
                value: {
                  absolute: {
                    money: [
                      {
                        currencyCode,
                        centAmount: Math.round(discountValue * 100), // Convert dollars to cents
                      },
                    ],
                  },
                },
              },
            });
          }
        }

        // Set sortOrder - only if changed
        if (
          sortOrder !== undefined &&
          sortOrder !== currentPromotion.sortOrder
        ) {
          actions.push({
            changeSortOrder: {
              sortOrder,
            },
          });
        }

        // Set isActive - only if changed
        if (isActive !== undefined && isActive !== currentPromotion.isActive) {
          actions.push({
            changeIsActive: {
              isActive,
            },
          });
        }

        // Don't send the request if there are no changes
        if (actions.length === 0) {
          console.log('No changes detected, skipping update');
          return currentPromotion; // Return the current promotion as if it was updated
        }

        console.log('Updating product discount with actions:', actions);

        // Execute the mutation
        const updateResponse = await runUpdateMutation({
          variables: {
            id,
            version,
            actions,
          },
        });

        return updateResponse.data?.updateProductDiscount || null;
      } catch (error: unknown) {
        console.error('Error updating product discount:', error);

        // Log detailed error information for debugging
        const typedError = error as any; // Type assertion for accessing GraphQL errors
        if (typedError.graphQLErrors) {
          console.error(
            'GraphQL errors:',
            JSON.stringify(typedError.graphQLErrors, null, 2)
          );
        }

        setError(
          error instanceof Error ? error : new Error('Unknown error occurred')
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [refetch, runUpdateMutation]
  );

  const deleteProductDiscount = async (
    input: DeleteProductDiscountInput
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await runDeleteMutation({
        variables: {
          id: input.id,
          version: input.version,
        },
      });

      return !!response.data?.deleteProductDiscount?.id;
    } catch (error: unknown) {
      console.error('Error deleting product discount:', error);

      // Log detailed error information for debugging
      const typedError = error as any;
      if (typedError.graphQLErrors) {
        console.error(
          'GraphQL errors:',
          JSON.stringify(typedError.graphQLErrors, null, 2)
        );
      }

      setError(
        error instanceof Error ? error : new Error('Unknown error occurred')
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (centAmount: number, currencyCode: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(centAmount / 100); // Convert cent amount to dollars
  };

  const formatPercentage = (permyriad: number): string => {
    // Convert permyriad to percentage (permyriad is 1/10000, so divide by 100 to get percentage)
    return `${(permyriad / 100).toFixed(2)}%`; // Convert permyriad to percentage
  };

  return {
    fetchPromotions,
    getPromotionById,
    createProductDiscount,
    updatePromotionActiveStatus,
    updateProductDiscount,
    deleteProductDiscount,
    loading,
    error,
  };
};

export default usePromotions;
