import { useCallback, useState } from 'react';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import { useMcQuery } from '@commercetools-frontend/application-shell';
import gql from 'graphql-tag';

// Define the order line item type
interface LineItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  variant: {
    images?: { url: string }[];
  };
  totalPrice: {
    centAmount: number;
    currencyCode: string;
  };
}

// Define the order type
interface Order {
  id: string;
  createdAt: string;
  lineItems: LineItem[];
  orderState: string;
}

// Define the GraphQL response type
interface OrdersResponse {
  orders: {
    results: Order[];
  };
}

// Define the product type for the hook results
export interface TopProduct {
  productId: string;
  name: string;
  revenue: number;
  quantity: number;
  currencyCode: string;
  imageUrl?: string;
}

// GraphQL query to fetch store orders with products
const GET_STORE_ORDERS_WITH_PRODUCTS = gql`
  query GetStoreOrdersWithProducts(
    $where: String
    $sort: [String!]
    $locale: Locale!
  ) {
    orders(where: $where, sort: $sort) {
      results {
        id
        createdAt
        orderState
        lineItems {
          id
          productId
          name(locale: $locale)
          quantity
          variant {
            images {
              url
            }
          }
          totalPrice {
            centAmount
            currencyCode
          }
        }
      }
    }
  }
`;

export type TimePeriod = 'month' | 'quarter' | 'year';

interface UseTopProductsHook {
  topProducts: TopProduct[];
  loading: boolean;
  error: Error | null;
  currentPeriod: string;
  fetchTopProducts: (storeKey: string, period: TimePeriod) => Promise<void>;
}

const getStartDateForPeriod = (period: TimePeriod): Date => {
  const now = new Date();
  switch (period) {
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      return new Date(now.getFullYear(), quarter * 3, 1);
    case 'year':
      return new Date(now.getFullYear(), 0, 1);
    default:
      return new Date(now.getFullYear(), now.getMonth(), 1);
  }
};

const getPeriodLabel = (period: TimePeriod): string => {
  const now = new Date();
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  switch (period) {
    case 'month':
      return months[now.getMonth()];
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3) + 1;
      return `Q${quarter} ${now.getFullYear()}`;
    case 'year':
      return now.getFullYear().toString();
    default:
      return months[now.getMonth()];
  }
};

const useTopProducts = (): UseTopProductsHook => {
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<string>('');

  const { dataLocale } = useApplicationContext((context) => ({
    dataLocale: context.dataLocale,
  }));

  const { refetch } = useMcQuery<OrdersResponse>(
    GET_STORE_ORDERS_WITH_PRODUCTS,
    {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
      variables: {
        locale: dataLocale,
      },
      skip: true, // Skip on initial render
    }
  );

  const fetchTopProducts = useCallback(
    async (storeKey: string, period: TimePeriod) => {
      setLoading(true);
      setError(null);

      try {
        const startDate = getStartDateForPeriod(period);
        const formattedStartDate = startDate.toISOString();

        // Create a where query for the store and date range
        const whereQuery = `store(key="${storeKey}") AND createdAt >= "${formattedStartDate}"`;

        const { data } = await refetch({
          where: whereQuery,
          sort: ['createdAt desc'],
          locale: dataLocale,
        });

        if (!data || !data.orders) {
          setTopProducts([]);
          return;
        }

        const { results } = data.orders;

        // Initialize product map to track revenues
        const productMap = new Map<
          string,
          {
            productId: string;
            name: string;
            revenue: number;
            quantity: number;
            currencyCode: string;
            imageUrl?: string;
          }
        >();

        // Aggregate product data
        results.forEach((order: Order) => {
          if (!order.lineItems) return;

          order.lineItems.forEach((lineItem: LineItem) => {
            if (!lineItem.productId) return;

            const productId = lineItem.productId;
            const revenue = lineItem.totalPrice.centAmount / 100; // Convert cents to dollars
            const imageUrl = lineItem.variant?.images?.[0]?.url;

            if (productMap.has(productId)) {
              const product = productMap.get(productId)!;
              product.revenue += revenue;
              product.quantity += lineItem.quantity;
            } else {
              productMap.set(productId, {
                productId,
                name: lineItem.name,
                revenue,
                quantity: lineItem.quantity,
                currencyCode: lineItem.totalPrice.currencyCode,
                imageUrl,
              });
            }
          });
        });

        // Convert map to array and sort by revenue
        const sortedProducts = Array.from(productMap.values())
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5); // Get top 5

        setTopProducts(sortedProducts);
        setCurrentPeriod(getPeriodLabel(period));
      } catch (err) {
        console.error('Error fetching top products:', err);
        setError(
          err instanceof Error ? err : new Error('Failed to fetch top products')
        );
      } finally {
        setLoading(false);
      }
    },
    [refetch, dataLocale]
  );

  return {
    topProducts,
    loading,
    error,
    currentPeriod,
    fetchTopProducts,
  };
};

export default useTopProducts;
