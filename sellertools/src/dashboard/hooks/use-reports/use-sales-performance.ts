import { useCallback, useState, useEffect } from 'react';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
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

export type TimePeriod = 'week' | 'month' | 'quarter' | 'year';

export interface SalesDataPoint {
  label: string;
  value: number;
  currencyCode: string;
}

interface UseSalesPerformanceHook {
  salesData: SalesDataPoint[];
  loading: boolean;
  error: Error | null;
  fetchSalesData: (storeKey: string, period: TimePeriod) => Promise<void>;
}

const getStartDateForPeriod = (period: TimePeriod): Date => {
  const now = new Date();
  switch (period) {
    case 'week':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      return weekStart;
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

const getLabelsForPeriod = (period: TimePeriod): string[] => {
  switch (period) {
    case 'week':
      return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    case 'month':
      const daysInMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        0
      ).getDate();
      return Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
    case 'quarter':
      const currentQuarter = Math.floor(new Date().getMonth() / 3);
      const monthsInQuarter = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ].slice(currentQuarter * 3, (currentQuarter + 1) * 3);
      return monthsInQuarter;
    case 'year':
      return [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
    default:
      return [];
  }
};

const useSalesPerformance = (): UseSalesPerformanceHook => {
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { refetch } = useMcQuery<OrdersResponse>(GET_STORE_ORDERS_BY_DATE, {
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
    skip: true, // Skip on initial render
  });

  const fetchSalesData = useCallback(
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
          sort: ['createdAt asc'],
        });

        if (!data || !data.orders) {
          setSalesData([]);
          return;
        }

        const { results } = data.orders;

        // Default to USD if mixed currencies
        const defaultCurrency =
          results.length > 0 ? results[0].totalPrice.currencyCode : 'USD';

        // Get the appropriate labels for the period
        const labels = getLabelsForPeriod(period);

        // Initialize data points with zero values
        const initialDataPoints: SalesDataPoint[] = labels.map((label) => ({
          label,
          value: 0,
          currencyCode: defaultCurrency,
        }));

        // Group orders by the appropriate time unit and sum their values
        results.forEach((order: Order) => {
          const orderDate = new Date(order.createdAt);
          let index;

          switch (period) {
            case 'week':
              index = orderDate.getDay(); // 0-6 for Sunday-Saturday
              break;
            case 'month':
              index = orderDate.getDate() - 1; // 0-30 for days of month
              break;
            case 'quarter':
              // Calculate month within quarter (0-2)
              index = orderDate.getMonth() % 3;
              break;
            case 'year':
              index = orderDate.getMonth(); // 0-11 for January-December
              break;
            default:
              index = -1;
          }

          // Add order value to corresponding data point
          if (index >= 0 && index < initialDataPoints.length) {
            initialDataPoints[index].value += order.totalPrice.centAmount / 100; // Convert cents to dollars
          }
        });

        setSalesData(initialDataPoints);
      } catch (err) {
        console.error('Error fetching sales data:', err);
        setError(
          err instanceof Error ? err : new Error('Failed to fetch sales data')
        );
      } finally {
        setLoading(false);
      }
    },
    [refetch]
  );

  return {
    salesData,
    loading,
    error,
    fetchSalesData,
  };
};

export default useSalesPerformance;
