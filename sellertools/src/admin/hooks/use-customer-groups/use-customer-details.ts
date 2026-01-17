import { ApolloError } from '@apollo/client';
import { useMcQuery } from '@commercetools-frontend/application-shell';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import gql from 'graphql-tag';
import { TCustomerGroup } from '../../../types/generated/ctp';

interface CustomerGroupsData {
  customerGroups: {
    results: TCustomerGroup[];
  };
}

interface UseCustomerDetailsResult {
  loading: boolean;
  error?: ApolloError;
  customerGroups: {
    id: string;
    name: string;
    key?: string | null;
  }[];
}

const CUSTOMER_GROUPS_QUERY = gql`
  query GetCustomers {
    customerGroups(limit: 500) {
      results {
        id
        name
        key
      }
    }
  }
`;

const useCustomerGroups = (): UseCustomerDetailsResult => {
  const { data, loading, error } = useMcQuery<CustomerGroupsData>(
    CUSTOMER_GROUPS_QUERY,
    {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
    }
  );

  return {
    loading,
    error,
    customerGroups: (data?.customerGroups?.results || []).map(
      (customerGroup) => ({
        id: customerGroup.id,
        name: customerGroup.name,
        key: customerGroup.key,
      })
    ),
  };
};

export default useCustomerGroups;
