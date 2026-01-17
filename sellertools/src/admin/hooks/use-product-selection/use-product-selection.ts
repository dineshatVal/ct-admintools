import { ApolloError } from '@apollo/client';
import { useMcQuery } from '@commercetools-frontend/application-shell';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import gql from 'graphql-tag';
import { TProductSelection } from '../../../types/generated/ctp';

interface ProductSelectionsData {
  productSelections: {
    results: TProductSelection[];
  };
}

interface UseCustomerDetailsResult {
  loading: boolean;
  error?: ApolloError;
  productSelections: {
    id: string;
    name?: string | null;
    key?: string | null;
  }[];
}

const PRODUCT_SELECTIONS_QUERY = gql`
  query GetProductSelections($locale: Locale) {
    productSelections(limit: 500) {
      results {
        id
        name(locale: $locale)
        key
      }
    }
  }
`;

const useProductSelections = (): UseCustomerDetailsResult => {
  const { dataLocale } = useApplicationContext();
  const { data, loading, error } = useMcQuery<ProductSelectionsData>(
    PRODUCT_SELECTIONS_QUERY,
    {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
      variables: {
        locale: dataLocale,
      },
    }
  );

  return {
    loading,
    error,
    productSelections: (data?.productSelections?.results || []).map(
      (productSelection) => ({
        id: productSelection.id,
        name: productSelection.name,
        key: productSelection.key,
      })
    ),
  };
};

export default useProductSelections;
