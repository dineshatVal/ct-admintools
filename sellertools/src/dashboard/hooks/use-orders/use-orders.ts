import {
  useMcMutation,
  useMcQuery,
} from '@commercetools-frontend/application-shell';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import { TDataTableSortingState } from '@commercetools-uikit/hooks';
import gql from 'graphql-tag';
import { useCallback, useState } from 'react';

interface Order {
  id: string;
  version: number;
  orderNumber?: string;
  createdAt: string;
  lastModifiedAt?: string;
  totalPrice: {
    centAmount: number;
    currencyCode: string;
  };
  orderState: string;
  state?: {
    name: string;
    key: string;
  };
  customerId?: string;
  customerEmail?: string;
  customerName?: string;
  lineItems?: Array<any>;
  shippingAddress?: any;
  billingAddress?: any;
  customer?: {
    firstName?: string;
    lastName?: string;
  };
}

// GraphQL query to fetch store orders
const GET_STORE_ORDERS = gql`
  query GetStoreOrders(
    $where: String
    $sort: [String!]
    $limit: Int
    $offset: Int
  ) {
    orders(where: $where, sort: $sort, limit: $limit, offset: $offset) {
      total
      results {
        id
        version
        orderNumber
        createdAt
        totalPrice {
          centAmount
          currencyCode
        }
        orderState
        state {
          name(locale: "en-US")
          key
        }
        customerId
        customerEmail
        customer {
          firstName
          lastName
        }
      }
    }
  }
`;

// GraphQL query to fetch a single order with details
const GET_ORDER_BY_ID = gql`
  query GetOrderById($id: String!, $locale: Locale!) {
    order(id: $id) {
      id
      version
      orderNumber
      createdAt
      lastModifiedAt
      totalPrice {
        centAmount
        currencyCode
      }
      orderState
      state {
        name(locale: "en-US")
        key
      }
      customerId
      customerEmail
      lineItems {
        id
        name(locale: $locale)
        productId
        quantity
        variant {
          images {
            url
          }
        }
        price {
          value {
            centAmount
            currencyCode
          }
        }
        totalPrice {
          centAmount
          currencyCode
        }
      }
      shippingAddress {
        firstName
        lastName
        streetName
        streetNumber
        city
        postalCode
        country
      }
      billingAddress {
        firstName
        lastName
        streetName
        streetNumber
        city
        postalCode
        country
      }
    }
  }
`;

// GraphQL mutation to update order state
const UPDATE_ORDER_STATE = gql`
  mutation UpdateOrderState(
    $id: String!
    $version: Long!
    $actions: [OrderUpdateAction!]!
  ) {
    updateOrder(id: $id, version: $version, actions: $actions) {
      id
      version
      orderState
      state {
        name(locale: "en-US")
        key
      }
    }
  }
`;

// GraphQL mutation to transition order state
const TRANSITION_ORDER_STATE = gql`
  mutation TransitionOrderState(
    $id: String!
    $version: Long!
    $actions: [OrderUpdateAction!]!
  ) {
    updateOrder(id: $id, version: $version, actions: $actions) {
      id
      version
      orderState
      state {
        name(locale: "en-US")
        key
      }
    }
  }
`;

// Get available states query
const GET_ORDER_STATES = gql`
  query GetOrderStates {
    states(where: "type=\\"OrderState\\"") {
      results {
        id
        key
        name(locale: "en-US")
        description(locale: "en-US")
      }
    }
  }
`;

interface OrderDetailResponse {
  order: Order;
}

interface OrderState {
  id: string;
  key: string;
  name: string;
  description?: string;
}

interface OrderStatesResponse {
  states: {
    results: OrderState[];
  };
}

interface UseOrdersHook {
  fetchOrdersByStore: (storeKey: string) => Promise<Order[]>;
  fetchOrderById: (orderId: string) => Promise<Order | null>;
  // fetchCustomerById: (customerId: string) => Promise<Customer | null>;
  updateOrderState: (
    orderId: string,
    version: number,
    newState: string
  ) => Promise<boolean>;
  transitionOrderState: (
    orderId: string,
    version: number,
    stateKey: string
  ) => Promise<boolean>;
  fetchOrderStates: () => Promise<OrderState[]>;
  // enrichOrdersWithCustomerNames: (orders: Order[]) => Promise<Order[]>;
  orders: Order[];
  orderStates: OrderState[];
  total: number;
  loading: boolean;
  error: Error | null;
}

const useOrders = ({
  page,
  perPage,
  tableSorting,
}: {
  page?: { value: number };
  perPage?: { value: number };
  tableSorting?: TDataTableSortingState;
}): UseOrdersHook => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStates, setOrderStates] = useState<OrderState[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { dataLocale } = useApplicationContext((context) => ({
    dataLocale: context.dataLocale,
  }));

  const { refetch, loading: queryLoading } = useMcQuery<{
    orders?: { results: Array<Order>; total: number };
  }>(GET_STORE_ORDERS, {
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
  });

  const { refetch: refetchOrderById, loading: orderDetailLoading } =
    useMcQuery<OrderDetailResponse>(GET_ORDER_BY_ID, {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
      variables: {
        locale: dataLocale,
      },
      skip: true, // Skip on initial render
    });

  const { refetch: refetchOrderStates, loading: statesLoading } =
    useMcQuery<OrderStatesResponse>(GET_ORDER_STATES, {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
      skip: true, // Skip on initial render
    });

  const [executeUpdateOrderState, { loading: updateLoading }] = useMcMutation(
    UPDATE_ORDER_STATE,
    {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
    }
  );

  const [executeTransitionOrderState, { loading: transitionLoading }] =
    useMcMutation(TRANSITION_ORDER_STATE, {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
    });

  const fetchOrdersByStore = useCallback(
    async (storeKey: string): Promise<Order[]> => {
      setLoading(true);
      setError(null);

      try {
        console.log(`Fetching orders for store ${storeKey}`);

        // Create a where condition to filter orders by store key
        const whereCondition = `store(key="${storeKey}")`;

        const { data, error: apiError } = await refetch({
          where: whereCondition,
          sort: tableSorting?.value
            ? [tableSorting.value.key + ' ' + tableSorting.value.order]
            : ['createdAt desc'],
          limit: perPage?.value,
          offset: ((page?.value || 1) - 1) * (perPage?.value || 20),
        });

        if (apiError) {
          console.error('API Error fetching orders:', apiError);
          throw apiError;
        }

        if (!data?.orders?.results || data.orders.results.length === 0) {
          console.log('No orders found for this store');
          setOrders([]);
          setTotal(0);
          return [];
        }

        console.log('Orders retrieved:', data.orders.results.length);

        const formattedOrders = data.orders.results.map((order) => ({
          ...order,
          createdAt: new Date(order.createdAt).toLocaleString(),
        }));

        setOrders(formattedOrders);
        setTotal(data.orders.total);
        return formattedOrders;
      } catch (err) {
        console.error('Error in fetchOrdersByStore:', err);
        const errorObject =
          err instanceof Error
            ? err
            : new Error('Unknown error fetching orders');
        setError(errorObject);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [refetch, tableSorting?.value, page?.value, perPage?.value]
  );

  const fetchOrderById = useCallback(
    async (orderId: string): Promise<Order | null> => {
      setLoading(true);
      setError(null);

      try {
        console.log(`Fetching order details for ID: ${orderId}`);

        const { data, error: apiError } = await refetchOrderById({
          id: orderId,
          locale: dataLocale,
        });

        if (apiError) {
          console.error('API Error fetching order details:', apiError);
          throw apiError;
        }

        if (!data?.order) {
          console.log('Order not found');
          return null;
        }

        console.log('Order details retrieved');

        // Format dates
        let formattedOrder = {
          ...data.order,
          createdAt: new Date(data.order.createdAt).toLocaleString(),
          lastModifiedAt: data.order.lastModifiedAt
            ? new Date(data.order.lastModifiedAt).toLocaleString()
            : undefined,
        };

        return formattedOrder;
      } catch (err) {
        console.error('Error in fetchOrderById:', err);
        const errorObject =
          err instanceof Error
            ? err
            : new Error('Unknown error fetching order details');
        setError(errorObject);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [refetchOrderById, dataLocale]
  );

  const fetchOrderStates = useCallback(async (): Promise<OrderState[]> => {
    try {
      console.log('Fetching available order states');

      const { data, error: apiError } = await refetchOrderStates();

      if (apiError) {
        console.error('API Error fetching order states:', apiError);
        throw apiError;
      }

      if (!data?.states?.results) {
        console.log('No order states found');
        return [];
      }

      console.log('Order states retrieved:', data.states.results.length);
      setOrderStates(data.states.results);
      return data.states.results;
    } catch (err) {
      console.error('Error in fetchOrderStates:', err);
      return [];
    }
  }, [refetchOrderStates]);

  const transitionOrderState = useCallback(
    async (
      orderId: string,
      version: number,
      stateKey: string
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        console.log(`Transitioning order ${orderId} to state: ${stateKey}`);

        // Find the state name for optimistic update
        const stateName =
          orderStates.find((state) => state.key === stateKey)?.name || '';

        // Perform an optimistic update immediately
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  state: {
                    key: stateKey,
                    name: stateName,
                  },
                }
              : order
          )
        );

        const response = await executeTransitionOrderState({
          variables: {
            id: orderId,
            version: version,
            actions: [
              {
                transitionState: {
                  state: {
                    typeId: 'state',
                    key: stateKey,
                  },
                },
              },
            ],
          },
        });

        if (!response || response.errors) {
          console.error('Error transitioning order state:', response?.errors);

          // Revert to previous state if there was an error
          setOrders((prevOrders) =>
            prevOrders.map((order) =>
              order.id === orderId && order.state?.key === stateKey
                ? {
                    ...order,
                    state: undefined, // Reset state since API call failed
                  }
                : order
            )
          );

          throw new Error('Failed to transition order state');
        }

        console.log('Order state transitioned successfully');

        // Update with the actual version from the API response
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  state: (response.data as any).updateOrder.state,
                  version: (response.data as any).updateOrder.version,
                }
              : order
          )
        );

        return true;
      } catch (err) {
        console.error('Error in transitionOrderState:', err);
        const errorObject =
          err instanceof Error
            ? err
            : new Error('Unknown error transitioning order state');
        setError(errorObject);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [executeTransitionOrderState, orderStates]
  );

  const updateOrderState = useCallback(
    async (
      orderId: string,
      version: number,
      newState: string
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        console.log(`Updating order ${orderId} to state: ${newState}`);

        // Perform an optimistic update immediately
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  orderState: newState,
                }
              : order
          )
        );

        const response = await executeUpdateOrderState({
          variables: {
            id: orderId,
            version: version,
            actions: [
              {
                changeOrderState: {
                  orderState: newState,
                },
              },
            ],
          },
        });

        if (!response || response.errors) {
          console.error('Error updating order state:', response?.errors);

          // Revert to previous state if there was an error
          setOrders((prevOrders) =>
            prevOrders.map((order) =>
              order.id === orderId && order.orderState === newState
                ? {
                    ...order,
                    orderState: order.orderState, // Reset to previous state
                  }
                : order
            )
          );

          throw new Error('Failed to update order state');
        }

        console.log('Order state updated successfully');

        // Update with actual version from API
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  orderState: newState,
                  version: (response.data as any).updateOrder.version,
                }
              : order
          )
        );

        return true;
      } catch (err) {
        console.error('Error in updateOrderState:', err);
        const errorObject =
          err instanceof Error
            ? err
            : new Error('Unknown error updating order state');
        setError(errorObject);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [executeUpdateOrderState]
  );

  return {
    fetchOrdersByStore,
    fetchOrderById,
    updateOrderState,
    transitionOrderState,
    fetchOrderStates,
    orders,
    orderStates,
    total,
    loading:
      loading ||
      queryLoading ||
      orderDetailLoading ||
      updateLoading ||
      transitionLoading ||
      statesLoading,
    error,
  };
};

export default useOrders;
