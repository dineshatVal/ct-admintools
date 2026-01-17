import { useCallback, useState } from 'react';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import { useMcQuery } from '@commercetools-frontend/application-shell';
import gql from 'graphql-tag';

// Define the order type based on the GraphQL query response
interface Order {
  id: string;
  createdAt: string;
  totalPrice: {
    centAmount: number;
    currencyCode: string;
  };
  orderState: string;
}

// Define the GraphQL response type
interface OrdersResponse {
  orders: {
    results: Order[];
  };
}

// GraphQL query to fetch store orders with date range
const GET_STORE_ORDERS_BY_DATE = gql`
  query GetStoreOrdersByDate($where: String, $sort: [String!]) {
    orders(where: $where, sort: $sort) {
      results {
        id
        createdAt
        totalPrice {
          centAmount
          currencyCode
        }
        orderState
      }
    }
  }
`;

export interface AverageOrderValues {
  week: {
    value: number;
    currencyCode: string;
    percentChange: number;
  };
  month: {
    value: number;
    currencyCode: string;
    percentChange: number;
  };
  year: {
    value: number;
    currencyCode: string;
  };
}

interface UseAverageOrderValueHook {
  averages: AverageOrderValues;
  loading: boolean;
  error: Error | null;
  fetchAverageOrderValues: (storeKey: string) => Promise<void>;
}

const getStartOfWeek = (date: Date): Date => {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay()); // Start on Sunday
  start.setHours(0, 0, 0, 0);
  return start;
};

const getStartOfPreviousWeek = (date: Date): Date => {
  const start = getStartOfWeek(date);
  start.setDate(start.getDate() - 7);
  return start;
};

const getStartOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const getStartOfPreviousMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
};

const getStartOfYear = (date: Date): Date => {
  return new Date(date.getFullYear(), 0, 1);
};

const useAverageOrderValue = (): UseAverageOrderValueHook => {
  const [averages, setAverages] = useState<AverageOrderValues>({
    week: { value: 0, currencyCode: 'USD', percentChange: 0 },
    month: { value: 0, currencyCode: 'USD', percentChange: 0 },
    year: { value: 0, currencyCode: 'USD' },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { refetch } = useMcQuery<OrdersResponse>(GET_STORE_ORDERS_BY_DATE, {
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
    skip: true, // Skip on initial render
  });

  const fetchAverageOrderValues = useCallback(
    async (storeKey: string) => {
      setLoading(true);
      setError(null);

      try {
        const now = new Date();
        const startOfYear = getStartOfYear(now);
        const startOfWeek = getStartOfWeek(now);
        const startOfPrevWeek = getStartOfPreviousWeek(now);
        const startOfMonth = getStartOfMonth(now);
        const startOfPrevMonth = getStartOfPreviousMonth(now);

        // Create a where query for the store and from the beginning of the year
        const whereQuery = `store(key="${storeKey}") AND createdAt >= "${startOfYear.toISOString()}"`;

        const { data } = await refetch({
          where: whereQuery,
          sort: ['createdAt desc'],
        });

        if (!data || !data.orders) {
          return;
        }

        const { results } = data.orders;

        // Default to USD if mixed currencies
        const defaultCurrency =
          results.length > 0 ? results[0].totalPrice.currencyCode : 'USD';

        // Initialize calculations
        let weekTotal = 0;
        let weekCount = 0;

        let prevWeekTotal = 0;
        let prevWeekCount = 0;

        let monthTotal = 0;
        let monthCount = 0;

        let prevMonthTotal = 0;
        let prevMonthCount = 0;

        let yearTotal = 0;
        let yearCount = 0;

        // Calculate totals
        results.forEach((order: Order) => {
          const orderDate = new Date(order.createdAt);
          const orderAmount = order.totalPrice.centAmount / 100; // Convert cents to dollars

          // This week's orders
          if (orderDate >= startOfWeek) {
            weekTotal += orderAmount;
            weekCount++;
          }
          // Previous week's orders
          else if (orderDate >= startOfPrevWeek) {
            prevWeekTotal += orderAmount;
            prevWeekCount++;
          }

          // This month's orders
          if (orderDate >= startOfMonth) {
            monthTotal += orderAmount;
            monthCount++;
          }
          // Previous month's orders
          else if (orderDate >= startOfPrevMonth) {
            prevMonthTotal += orderAmount;
            prevMonthCount++;
          }

          // This year's orders
          if (orderDate >= startOfYear) {
            yearTotal += orderAmount;
            yearCount++;
          }
        });

        // Calculate averages
        const weekAverage = weekCount === 0 ? 0 : weekTotal / weekCount;
        const prevWeekAverage =
          prevWeekCount === 0 ? 0 : prevWeekTotal / prevWeekCount;
        const monthAverage = monthCount === 0 ? 0 : monthTotal / monthCount;
        const prevMonthAverage =
          prevMonthCount === 0 ? 0 : prevMonthTotal / prevMonthCount;
        const yearAverage = yearCount === 0 ? 0 : yearTotal / yearCount;

        // Calculate percent changes
        const weekPercentChange =
          prevWeekAverage === 0
            ? 0
            : ((weekAverage - prevWeekAverage) / prevWeekAverage) * 100;

        const monthPercentChange =
          prevMonthAverage === 0
            ? 0
            : ((monthAverage - prevMonthAverage) / prevMonthAverage) * 100;

        setAverages({
          week: {
            value: weekAverage,
            currencyCode: defaultCurrency,
            percentChange: weekPercentChange,
          },
          month: {
            value: monthAverage,
            currencyCode: defaultCurrency,
            percentChange: monthPercentChange,
          },
          year: {
            value: yearAverage,
            currencyCode: defaultCurrency,
          },
        });
      } catch (err) {
        console.error('Error fetching average order values:', err);
        setError(
          err instanceof Error
            ? err
            : new Error('Failed to fetch average order values')
        );
      } finally {
        setLoading(false);
      }
    },
    [refetch]
  );

  return {
    averages,
    loading,
    error,
    fetchAverageOrderValues,
  };
};

export default useAverageOrderValue;
