import { useMcQuery } from '@commercetools-frontend/application-shell';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import gql from 'graphql-tag';
import { useCallback, useState } from 'react';
import { TCustomer } from '../../../types/generated/ctp';

interface CustomerData {
  customer: TCustomer;
}

interface CustomerVariables {
  id: string;
}

interface UseCustomerDetailsResult {
  customer: TCustomer | null;
  loading: boolean;
  error: Error | null;
  fetchCustomer: (customerId: string) => Promise<TCustomer | null>;
  customerGroupLoading: boolean;
  fetchCustomerGroup: (customerGroupId: string) => Promise<
    | {
        id: string;
        key: string;
      }
    | undefined
  >;
}

const CUSTOMER_QUERY = gql`
  query GetCustomer($id: String!) {
    customer(id: $id) {
      id
      version
      email
      firstName
      lastName
      isEmailVerified
      customerNumber
      key
      stores {
        id
        key
      }
      customerGroup {
        id
        name
        key
      }
      custom {
        customFieldsRaw {
          name
          value
        }
      }
      authenticationMode
      createdAt
      lastModifiedAt
    }
  }
`;

const CUSTOMERGROUP_QUERY = gql`
  query GetCustomerGroup($id: String!) {
    customerGroup(id: $id) {
      id
      key
    }
  }
`;

interface CustomerGroupData {
  customerGroup: {
    id: string;
    key: string;
  };
}

const useCustomerDetails = (): UseCustomerDetailsResult => {
  const [customer, setCustomer] = useState<TCustomer | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const { loading, refetch } = useMcQuery<CustomerData, CustomerVariables>(
    CUSTOMER_QUERY,
    {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
      skip: true, // Skip initial query, we'll use refetch
    }
  );

  const { loading: customerGroupLoading, refetch: refetchCustomerGroup } =
    useMcQuery<CustomerGroupData>(CUSTOMERGROUP_QUERY, {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
      skip: true, // Skip initial query, we'll use refetch
    });

  const fetchCustomer = useCallback(
    async (customerId: string): Promise<TCustomer | null> => {
      try {
        setError(null);
        const result = await refetch({ id: customerId });

        if (result.data?.customer) {
          setCustomer(result.data.customer);
          return result.data.customer;
        }

        return null;
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error('Unknown error fetching customer');
        setError(error);
        console.error('Error fetching customer:', error);
        return null;
      }
    },
    [refetch]
  );

  const fetchCustomerGroup = useCallback(
    async (
      customerGroupId: string
    ): Promise<
      | {
          id: string;
          key: string;
        }
      | undefined
    > => {
      const result = await refetchCustomerGroup({ id: customerGroupId });
      return result.data?.customerGroup;
    },
    [refetchCustomerGroup]
  );

  return {
    customer,
    loading,
    error,
    fetchCustomer,
    customerGroupLoading,
    fetchCustomerGroup,
  };
};

export default useCustomerDetails;
