import { ApolloError } from '@apollo/client';
import { useMcQuery } from '@commercetools-frontend/application-shell';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import gql from 'graphql-tag';
import { useCallback } from 'react';
import { TStore } from '../../../types/generated/ctp';

interface StoreData {
  store: TStore;
}

interface UseCustomerDetailsResult {
  loading: boolean;
  error?: ApolloError;
  getProductSelectionByStoreKey: (
    storeKey: string
  ) => Promise<string | undefined>;
}

const PRODUCT_SELECTIONS_QUERY = gql`
  query GetProductSelection($locale: Locale, $storeKey: String) {
    store(key: $storeKey) {
      key
      productSelections {
        productSelection {
          key
          name(locale: $locale)
          id
        }
      }
    }
  }
`;

const useProductSelections = (): UseCustomerDetailsResult => {
  const { dataLocale } = useApplicationContext();
  const { refetch, loading, error } = useMcQuery<StoreData>(
    PRODUCT_SELECTIONS_QUERY,
    {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
      skip: true,
    }
  );

  const getProductSelectionByStoreKey = useCallback(
    async (storeKey: string) => {
      if (!storeKey) {
        return undefined;
      }
      const { data } = await refetch({
        storeKey,
        locale: dataLocale,
      });
      return data?.store?.productSelections?.[0]?.productSelection?.id;
    },
    [refetch]
  );

  return {
    loading,
    error,
    getProductSelectionByStoreKey,
  };
};

export default useProductSelections;
