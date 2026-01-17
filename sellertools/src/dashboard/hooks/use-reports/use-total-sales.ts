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

export interface SalesTotals {
  today: {
    amount: number;
    orderCount: number;
    currencyCode: string;
  };
  week: {
    amount: number;
    orderCount: number;
    currencyCode: string;
    percentChange: number;
  };
  month: {
    amount: number;
    orderCount: number;
    currencyCode: string;
    percentChange: number;
  };
}

interface UseTotalSalesHook {
  totals: SalesTotals;
  loading: boolean;
  error: Error | null;
  fetchTotalSales: (storeKey: string) => Promise<void>;
}

const getStartOfDay = (date: Date): Date => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
};

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

const useTotalSales = (): UseTotalSalesHook => {
  const [totals, setTotals] = useState<SalesTotals>({
    today: { amount: 0, orderCount: 0, currencyCode: 'USD' },
    week: { amount: 0, orderCount: 0, currencyCode: 'USD', percentChange: 0 },
    month: { amount: 0, orderCount: 0, currencyCode: 'USD', percentChange: 0 },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { refetch } = useMcQuery<OrdersResponse>(GET_STORE_ORDERS_BY_DATE, {
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
    skip: true, // Skip on initial render
  });

  const fetchTotalSales = useCallback(
    async (storeKey: string) => {
      setLoading(true);
      setError(null);

      try {
        const now = new Date();
        const startOfToday = getStartOfDay(now);
        const startOfWeek = getStartOfWeek(now);
        const startOfPrevWeek = getStartOfPreviousWeek(now);
        const startOfMonth = getStartOfMonth(now);
        const startOfPrevMonth = getStartOfPreviousMonth(now);

        // Create a where query for the store and from the beginning of the previous month
        const whereQuery = `store(key="${storeKey}") AND createdAt >= "${startOfPrevMonth.toISOString()}"`;

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
        let todayAmount = 0;
        let todayOrderCount = 0;

        let weekAmount = 0;
        let weekOrderCount = 0;

        let prevWeekAmount = 0;
        let prevWeekOrderCount = 0;

        let monthAmount = 0;
        let monthOrderCount = 0;

        let prevMonthAmount = 0;
        let prevMonthOrderCount = 0;

        // Calculate totals
        results.forEach((order: Order) => {
          const orderDate = new Date(order.createdAt);
          const orderAmount = order.totalPrice.centAmount / 100; // Convert cents to dollars

          // Today's orders
          if (orderDate >= startOfToday) {
            todayAmount += orderAmount;
            todayOrderCount++;
          }

          // This week's orders
          if (orderDate >= startOfWeek) {
            weekAmount += orderAmount;
            weekOrderCount++;
          }
          // Previous week's orders
          else if (orderDate >= startOfPrevWeek) {
            prevWeekAmount += orderAmount;
            prevWeekOrderCount++;
          }

          // This month's orders
          if (orderDate >= startOfMonth) {
            monthAmount += orderAmount;
            monthOrderCount++;
          }
          // Previous month's orders
          else if (orderDate >= startOfPrevMonth) {
            prevMonthAmount += orderAmount;
            prevMonthOrderCount++;
          }
        });

        // Calculate percent changes
        const weekPercentChange =
          prevWeekAmount === 0
            ? 0
            : ((weekAmount - prevWeekAmount) / prevWeekAmount) * 100;

        const monthPercentChange =
          prevMonthAmount === 0
            ? 0
            : ((monthAmount - prevMonthAmount) / prevMonthAmount) * 100;

        setTotals({
          today: {
            amount: todayAmount,
            orderCount: todayOrderCount,
            currencyCode: defaultCurrency,
          },
          week: {
            amount: weekAmount,
            orderCount: weekOrderCount,
            currencyCode: defaultCurrency,
            percentChange: weekPercentChange,
          },
          month: {
            amount: monthAmount,
            orderCount: monthOrderCount,
            currencyCode: defaultCurrency,
            percentChange: monthPercentChange,
          },
        });
      } catch (err) {
        console.error('Error fetching total sales data:', err);
        setError(
          err instanceof Error
            ? err
            : new Error('Failed to fetch total sales data')
        );
      } finally {
        setLoading(false);
      }
    },
    [refetch]
  );

  return {
    totals,
    loading,
    error,
    fetchTotalSales,
  };
};

export default useTotalSales;
