import { useCallback, useState } from 'react';
import { useMcQuery } from '@commercetools-frontend/application-shell';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import gql from 'graphql-tag';

interface CustomerInfo {
  id: string;
  key?: string;
  email: string;
}

interface CustomerQueryResult {
  customers: {
    results: Array<{
      id: string;
      key?: string;
      email: string;
    }>;
  };
}

interface CustomerLookupResult {
  lookupCustomerByEmail: (email: string) => Promise<CustomerInfo | null>;
  loading: boolean;
  error: Error | null;
}

const LOOKUP_CUSTOMER_QUERY = gql`
  query LookupCustomerByEmail($where: String!) {
    customers(where: $where, limit: 1) {
      results {
        id
        key
        email
      }
    }
  }
`;

const useCustomerLookup = (): CustomerLookupResult => {
  const [error, setError] = useState<Error | null>(null);

  const { loading, refetch } = useMcQuery<
    CustomerQueryResult,
    { where: string }
  >(LOOKUP_CUSTOMER_QUERY, {
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
    skip: true, // Skip initial query
  });

  const lookupCustomerByEmail = useCallback(
    async (email: string): Promise<CustomerInfo | null> => {
      if (!email) return null;

      try {
        setError(null);
        console.log('Looking up customer by email:', email);

        // The where clause to find customer by email
        const whereClause = `email="${email}"`;

        const result = await refetch({ where: whereClause });
        console.log('Customer lookup result:', result);

        if (
          result.data?.customers?.results &&
          result.data.customers.results.length > 0
        ) {
          const customer = result.data.customers.results[0];
          console.log('Found customer:', customer);

          return {
            id: customer.id,
            key: customer.key,
            email: customer.email,
          };
        }

        return null;
      } catch (err) {
        console.error('Error looking up customer:', err);
        setError(
          err instanceof Error
            ? err
            : new Error('Unknown error during customer lookup')
        );
        return null;
      }
    },
    [refetch]
  );

  return {
    lookupCustomerByEmail,
    loading,
    error,
  };
};

export default useCustomerLookup;
