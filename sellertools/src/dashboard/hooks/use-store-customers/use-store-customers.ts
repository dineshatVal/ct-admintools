import { useCallback, useState } from 'react';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { useMcQuery } from '@commercetools-frontend/application-shell';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import gql from 'graphql-tag';
import { TDataTableSortingState } from '@commercetools-uikit/hooks';

interface Order {
  id: string;
  orderNumber?: string;
  createdAt: string;
  totalPrice: {
    centAmount: number;
    currencyCode: string;
  };
  orderState: string;
}

interface Customer {
  id: string;
  version: number;
  email: string;
  firstName?: string;
  lastName?: string;
  customerNumber?: string;
  createdAt: string;
  lastModifiedAt?: string;
  isEmailVerified: boolean;
  stores?: Array<{
    key: string;
  }>;
  customerGroup?: {
    id: string;
    name?: string;
  };
  custom?: {
    customFieldsRaw: Array<{
      name: string;
      value: string;
    }>;
  };
  orders?: Order[];
}

// GraphQL query to fetch customers by store key
const GET_STORE_CUSTOMERS = gql`
  query GetStoreCustomers(
    $where: String
    $sort: [String!]
    $limit: Int
    $offset: Int
  ) {
    customers(where: $where, sort: $sort, limit: $limit, offset: $offset) {
      total
      results {
        id
        version
        email
        firstName
        lastName
        customerNumber
        isEmailVerified
        createdAt
        lastModifiedAt
        customerGroup {
          id
          name
        }
        stores {
          key
        }
        custom {
          customFieldsRaw {
            name
            value
          }
        }
      }
    }
  }
`;

// GraphQL query to fetch a single customer with details
const GET_CUSTOMER_BY_ID = gql`
  query GetCustomerById($id: String!) {
    customer(id: $id) {
      id
      version
      email
      firstName
      lastName
      customerNumber
      isEmailVerified
      createdAt
      lastModifiedAt
      customerGroup {
        id
        name
      }
      stores {
        key
      }
      addresses {
        id
        firstName
        lastName
        streetName
        streetNumber
        postalCode
        city
        country
        phone
        email
      }
      defaultShippingAddressId
      defaultBillingAddressId
      custom {
        customFieldsRaw {
          name
          value
        }
      }
    }
  }
`;

// Add orders query
const GET_CUSTOMER_ORDERS = gql`
  query GetCustomerOrders($where: String, $sort: [String!], $limit: Int) {
    orders(where: $where, sort: $sort, limit: $limit) {
      results {
        id
        orderNumber
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

interface CustomerDetailResponse {
  customer: Customer;
}

interface CustomerOrdersResponse {
  orders: {
    results: Array<Order>;
  };
}

interface UseStoreCustomersHook {
  fetchCustomersByStore: (storeKey: string) => Promise<Customer[]>;
  fetchCustomerById: (customerId: string) => Promise<Customer | null>;
  fetchCustomerOrders: (customerId: string, limit?: number) => Promise<Order[]>;
  customers: Customer[];
  total: number;
  loading: boolean;
  error: Error | null;
}

const useStoreCustomers = ({
  page,
  perPage,
  tableSorting,
}: {
  page?: { value: number };
  perPage?: { value: number };
  tableSorting?: TDataTableSortingState;
}): UseStoreCustomersHook => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [customerGroups, setCustomerGroups] = useState<{
    [key: string]: { id: string; name: string };
  }>({});

  const { dataLocale } = useApplicationContext((context) => ({
    dataLocale: context.dataLocale,
  }));

  const { refetch, loading: queryLoading } = useMcQuery<{
    customers?: { results: Array<Customer>; total: number };
  }>(GET_STORE_CUSTOMERS, {
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
    skip: true, // Skip on initial render
  });

  const { refetch: refetchCustomerById, loading: customerDetailLoading } =
    useMcQuery<CustomerDetailResponse>(GET_CUSTOMER_BY_ID, {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
      skip: true, // Skip on initial render
    });

  const { refetch: refetchCustomerOrders, loading: ordersLoading } =
    useMcQuery<CustomerOrdersResponse>(GET_CUSTOMER_ORDERS, {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
      skip: true, // Skip on initial render
    });

  const fetchCustomersByStore = useCallback(
    async (storeKey: string): Promise<Customer[]> => {
      setLoading(true);
      setError(null);

      try {
        console.log(`Fetching customers for store ${storeKey}`);

        // Create a where condition to filter customers by store key
        const whereCondition = `stores(key="${storeKey}")`;

        const { data, error: apiError } = await refetch({
          where: whereCondition,
          sort: tableSorting?.value
            ? [tableSorting.value.key + ' ' + tableSorting.value.order]
            : ['createdAt desc'],
          limit: perPage?.value,
          offset: ((page?.value || 1) - 1) * (perPage?.value || 20),
        });

        if (apiError) {
          console.error('API Error fetching customers:', apiError);
          throw apiError;
        }

        if (!data?.customers?.results || data.customers.results.length === 0) {
          console.log('No customers found for this store');
          setCustomers([]);
          setTotal(0);
          return [];
        }

        console.log('Customers retrieved:', data.customers.results.length);

        const formattedCustomers = data.customers.results.map((customer) => ({
          ...customer,
          createdAt: new Date(customer.createdAt).toLocaleString(),
          lastModifiedAt: customer.lastModifiedAt
            ? new Date(customer.lastModifiedAt).toLocaleString()
            : undefined,
        }));

        setCustomers(formattedCustomers);
        setTotal(data.customers.total);
        return formattedCustomers;
      } catch (err) {
        console.error('Error in fetchCustomersByStore:', err);
        const errorObject =
          err instanceof Error
            ? err
            : new Error('Unknown error fetching customers');
        setError(errorObject);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [refetch, tableSorting?.value, page?.value, perPage?.value]
  );

  const fetchCustomerById = useCallback(
    async (customerId: string): Promise<Customer | null> => {
      setLoading(true);
      setError(null);

      try {
        console.log(`Fetching customer details for ID: ${customerId}`);

        const { data, error: apiError } = await refetchCustomerById({
          id: customerId,
        });

        if (apiError) {
          console.error('API Error fetching customer details:', apiError);
          throw apiError;
        }

        if (!data?.customer) {
          console.log('Customer not found');
          return null;
        }

        console.log('Customer details retrieved');

        // Format dates
        const formattedCustomer = {
          ...data.customer,
          createdAt: new Date(data.customer.createdAt).toLocaleString(),
          lastModifiedAt: data.customer.lastModifiedAt
            ? new Date(data.customer.lastModifiedAt).toLocaleString()
            : undefined,
        };

        return formattedCustomer;
      } catch (err) {
        console.error('Error in fetchCustomerById:', err);
        const errorObject =
          err instanceof Error
            ? err
            : new Error('Unknown error fetching customer details');
        setError(errorObject);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [refetchCustomerById]
  );

  const fetchCustomerOrders = useCallback(
    async (customerId: string, limit: number = 5): Promise<Order[]> => {
      try {
        console.log(`Fetching orders for customer ID: ${customerId}`);

        // Create a where condition to filter orders by customer ID
        const whereCondition = `customerId="${customerId}"`;

        const { data, error: apiError } = await refetchCustomerOrders({
          where: whereCondition,
          sort: ['createdAt desc'], // Sort by creation date, newest first
          limit,
        });

        if (apiError) {
          console.error('API Error fetching customer orders:', apiError);
          return [];
        }

        if (!data?.orders?.results) {
          console.log('No orders found for this customer');
          return [];
        }

        console.log(
          `Found ${data.orders.results.length} orders for customer ${customerId}`
        );

        const formattedOrders = data.orders.results.map((order) => ({
          ...order,
          createdAt: new Date(order.createdAt).toLocaleString(),
        }));

        return formattedOrders;
      } catch (err) {
        console.error('Error fetching customer orders:', err);
        return [];
      }
    },
    [refetchCustomerOrders]
  );

  return {
    fetchCustomersByStore,
    fetchCustomerById,
    fetchCustomerOrders,
    customers,
    total,
    loading: loading || queryLoading || customerDetailLoading || ordersLoading,
    error,
  };
};

export default useStoreCustomers;
