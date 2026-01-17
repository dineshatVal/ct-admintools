import { useState, useCallback } from 'react';
import {
  useMcMutation,
  useMcQuery,
} from '@commercetools-frontend/application-shell';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import type { ApolloError } from '@apollo/client';
import gql from 'graphql-tag';

// GraphQL Mutations and Queries
const CREATE_STORE = gql`
  mutation CreateStore($draft: CreateStore!) {
    createStore(draft: $draft) {
      id
      version
      key
      name(locale: "en-US")
      distributionChannels {
        id
        key
        name(locale: "en-US")
      }
      supplyChannels {
        id
        key
        name(locale: "en-US")
      }
      createdAt
    }
  }
`;

const CREATE_CHANNEL = gql`
  mutation CreateChannel($draft: ChannelDraft!) {
    createChannel(draft: $draft) {
      id
      version
      key
      name(locale: "en-US")
      description(locale: "en-US")
      roles
      createdAt
    }
  }
`;

const CREATE_PRODUCT_SELECTION = gql`
  mutation CreateProductSelection($draft: CreateProductSelectionDraft!) {
    createProductSelection(draft: $draft) {
      id
      version
      key
      name(locale: "en-US")
      mode
      createdAt
    }
  }
`;

const UPDATE_STORE = gql`
  mutation UpdateStore(
    $id: String!
    $version: Long!
    $actions: [StoreUpdateAction!]!
  ) {
    updateStore(id: $id, version: $version, actions: $actions) {
      id
      version
      key
      name(locale: "en-US")
      productSelections {
        productSelection {
          id
          key
          name(locale: "en-US")
        }
        active
      }
    }
  }
`;

const FIND_STORES = gql`
  query FindStores($where: String) {
    stores(where: $where) {
      results {
        id
        version
        key
        name(locale: "en-US")
        distributionChannels {
          id
          key
          name(locale: "en-US")
        }
        supplyChannels {
          id
          key
          name(locale: "en-US")
        }
      }
      total
    }
  }
`;

const FIND_CHANNELS = gql`
  query FindChannels($where: String) {
    channels(where: $where) {
      results {
        id
        version
        key
        name(locale: "en-US")
        description(locale: "en-US")
        roles
      }
      total
    }
  }
`;

// Types
export interface CreateStore {
  key: string;
  name: Array<{
    locale: string;
    value: string;
  }>;
  distributionChannels?: Array<{
    typeId: 'channel';
    key: string;
  }>;
  supplyChannels?: Array<{
    typeId: 'channel';
    key: string;
  }>;
}

export interface ChannelDraft {
  key: string;
  name?: Array<{
    locale: string;
    value: string;
  }>;
  description?: Array<{
    locale: string;
    value: string;
  }>;
  roles: Array<
    | 'InventorySupply'
    | 'ProductDistribution'
    | 'OrderExport'
    | 'OrderImport'
    | 'Primary'
  >;
}

export interface CreateProductSelectionDraft {
  key: string;
  name: Array<{
    locale: string;
    value: string;
  }>;
  mode: 'Individual';
}

export interface ProductSelection {
  id: string;
  version: number;
  key: string;
  name: string;
  mode: string;
  createdAt: string;
}

export interface Store {
  id: string;
  version: number;
  key: string;
  name: string;
  distributionChannels?: Array<{
    id: string;
    key: string;
    name?: string;
  }>;
  supplyChannels?: Array<{
    id: string;
    key: string;
    name?: string;
  }>;
  productSelections?: Array<{
    productSelection: {
      id: string;
      key: string;
      name: string;
    };
    active: boolean;
  }>;
  createdAt: string;
}

export interface Channel {
  id: string;
  version: number;
  key: string;
  name?: string;
  description?: string;
  roles: string[];
  createdAt: string;
}

export interface StoreSearchResult {
  results: Store[];
  total: number;
}

export interface ChannelSearchResult {
  results: Channel[];
  total: number;
}

export interface UseStoreManagementResult {
  // State
  loading: boolean;
  error: ApolloError | null;

  // Actions
  createStore: (draft: CreateStore) => Promise<Store | null>;
  createChannel: (draft: ChannelDraft) => Promise<Channel | null>;
  createProductSelection: (
    draft: CreateProductSelectionDraft,
    storeKey: string
  ) => Promise<ProductSelection | null>;
  findStores: (where?: string) => Promise<StoreSearchResult | null>;
  findChannels: (where?: string) => Promise<ChannelSearchResult | null>;
  clearError: () => void;
}

const useStoreManagement = (): UseStoreManagementResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApolloError | null>(null);

  // Mutations
  const [createStoreMutation] = useMcMutation(CREATE_STORE, {
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
  });

  const [createChannelMutation] = useMcMutation(CREATE_CHANNEL, {
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
  });

  const [createProductSelectionMutation] = useMcMutation(
    CREATE_PRODUCT_SELECTION,
    {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
    }
  );

  const [updateStoreMutation] = useMcMutation(UPDATE_STORE, {
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
  });

  // Queries
  const { refetch: findStoresQuery } = useMcQuery(FIND_STORES, {
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
    skip: true, // Skip initial query, we'll trigger it manually
  });

  const { refetch: findChannelsQuery } = useMcQuery(FIND_CHANNELS, {
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
    skip: true, // Skip initial query, we'll trigger it manually
  });

  // Create store function
  const createStore = useCallback(
    async (draft: CreateStore): Promise<Store | null> => {
      try {
        setLoading(true);
        setError(null);

        const { data } = await createStoreMutation({
          variables: { draft },
        });

        return (data as any)?.createStore || null;
      } catch (err) {
        const apolloError = err as ApolloError;
        setError(apolloError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [createStoreMutation]
  );

  // Create channel function
  const createChannel = useCallback(
    async (draft: ChannelDraft): Promise<Channel | null> => {
      try {
        setLoading(true);
        setError(null);

        const { data } = await createChannelMutation({
          variables: { draft },
        });

        return (data as any)?.createChannel || null;
      } catch (err) {
        const apolloError = err as ApolloError;
        setError(apolloError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [createChannelMutation]
  );

  // Create product selection function
  const createProductSelection = useCallback(
    async (
      draft: CreateProductSelectionDraft,
      storeKey: string
    ): Promise<ProductSelection | null> => {
      try {
        setLoading(true);
        setError(null);

        // Step 1: Create the product selection
        const { data: createData } = await createProductSelectionMutation({
          variables: { draft },
        });

        const productSelection = (createData as any)?.createProductSelection;
        if (!productSelection) {
          throw new Error('Failed to create product selection');
        }

        // Step 2: Find the store to get its current version
        const storeResult = await findStoresQuery({
          where: `key="${storeKey}"`,
        });

        const stores = (storeResult.data as any)?.stores?.results;
        if (!stores || stores.length === 0) {
          throw new Error(`Store with key "${storeKey}" not found`);
        }

        const store = stores[0];

        // Step 3: Update the store to set the product selection
        await updateStoreMutation({
          variables: {
            id: store.id,
            version: store.version,
            actions: [
              {
                setProductSelections: {
                  productSelections: [
                    {
                      productSelection: {
                        typeId: 'product-selection',
                        key: productSelection.key,
                      },
                      active: true,
                    },
                  ],
                },
              },
            ],
          },
        });

        return productSelection;
      } catch (err) {
        const apolloError = err as ApolloError;
        setError(apolloError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [createProductSelectionMutation, findStoresQuery, updateStoreMutation]
  );

  // Find stores function
  const findStores = useCallback(
    async (where?: string): Promise<StoreSearchResult | null> => {
      try {
        setLoading(true);
        setError(null);

        const { data } = await findStoresQuery({
          where,
        });

        return (data as any)?.stores || null;
      } catch (err) {
        const apolloError = err as ApolloError;
        setError(apolloError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [findStoresQuery]
  );

  // Find channels function
  const findChannels = useCallback(
    async (where?: string): Promise<ChannelSearchResult | null> => {
      try {
        setLoading(true);
        setError(null);

        const { data } = await findChannelsQuery({
          where,
        });

        return (data as any)?.channels || null;
      } catch (err) {
        const apolloError = err as ApolloError;
        setError(apolloError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [findChannelsQuery]
  );

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    createStore,
    createChannel,
    createProductSelection,
    findStores,
    findChannels,
    clearError,
  };
};

export default useStoreManagement;
