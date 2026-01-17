import { useMcQuery } from '@commercetools-frontend/application-shell';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import gql from 'graphql-tag';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import useCustomerBusinessUnits from '../hooks/use-customer-business-units';
import { useAuthContext } from './auth-context';
import useProductSelections from '../hooks/use-product-selection/use-product-selection';
import { useCustomObject } from '../hooks/use-custom-objects';
import {
  PRODUCT_SELECTION_KEY,
  SHARED_CONTAINER,
  STORE_KEY,
} from '../../constants';
import useStoreLookup from '../hooks/use-store-lookup/use-store-lookup';

// GraphQL query to get store information for a business unit
const GET_BUSINESS_UNIT_STORES = gql`
  query GetBusinessUnitStores($id: String!) {
    businessUnit(id: $id) {
      id
      stores {
        id
        key
        name(locale: "en-US")
        distributionChannels {
          id
        }
        supplyChannels {
          id
        }
      }
    }
  }
`;

interface Store {
  id: string;
  key: string;
  name: string;
  distributionChannels: {
    id: string;
  }[];
  supplyChannels: {
    id: string;
  }[];
}

interface GetBusinessUnitStoresResponse {
  businessUnit: {
    id: string;
    stores: Store[];
  };
}

// Type for business unit in the context
export interface BusinessUnit {
  id: string;
  version: number;
  name: string;
  addresses: BusinessUnitAddress[];
  custom: {
    customFieldsRaw: CustomField[];
  };
}

interface BusinessUnitAddress {
  id?: string;
  streetNumber: string;
  streetName: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  country: string;
}

interface CustomField {
  name: string;
  value: string | string[];
}

// Storage key for persisting the selected business unit ID
const BU_STORAGE_KEY = '__seller_selected_bu';

interface BusinessUnitContextType {
  businessUnits: BusinessUnit[];
  selectedBusinessUnit: BusinessUnit | null;
  loading: boolean;
  error: Error | null;
  selectBusinessUnit: (businessUnitId: string) => void;
  updateBusinessUnit: (
    businessUnitId: string,
    addressData: Partial<BusinessUnitAddress>,
    customFields: Record<string, string | string[]>
  ) => Promise<BusinessUnit | null>;
}

const BusinessUnitContext = createContext<BusinessUnitContextType>({
  businessUnits: [],
  selectedBusinessUnit: null,
  loading: false,
  error: null,
  selectBusinessUnit: () => {},
  updateBusinessUnit: async () => null,
});

interface BusinessUnitProviderProps {
  children: ReactNode;
}

export const BusinessUnitProvider: React.FC<BusinessUnitProviderProps> = ({
  children,
}) => {
  const {
    customerDetails,
    isLoggedIn,
    setStoreKey,
    storeKey: activeStoreKey,
    setMasterStoreKey,
    setProductSelectionId,
    setMasterProductSelectionId,
    setDistributionChannelId,
    setMasterDistributionChannelId,
    setSupplyChannelId,
  } = useAuthContext();
  const [isContextLoading, setIsContextLoading] = useState(false);
  const { getProductSelectionByStoreKey } = useProductSelections();
  const { getCustomObject } = useCustomObject(SHARED_CONTAINER);
  const { getStoreByKey } = useStoreLookup();
  const {
    businessUnits,
    selectedBusinessUnit,
    loading,
    error,
    fetchBusinessUnitsByCustomerId,
    selectBusinessUnit,
    updateBusinessUnit,
  } = useCustomerBusinessUnits();

  // Cache for storing business unit store information
  const [businessUnitStoresCache, setBusinessUnitStoresCache] = useState<
    Record<string, Store[]>
  >({});
  // Ref to track the previously selected business unit ID to avoid unnecessary rerenders
  const previousBusinessUnitIdRef = React.useRef<string | null>(null);

  // Set up query for business unit store information
  const { refetch: getBusinessUnitStores } =
    useMcQuery<GetBusinessUnitStoresResponse>(GET_BUSINESS_UNIT_STORES, {
      variables: {
        id: '',
      },
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
      skip: true, // Skip initial query, we'll trigger it manually
    });

  // Function to fetch store information for a business unit
  const fetchStoreInfo = async (
    businessUnitId: string
  ): Promise<Store[] | undefined> => {
    try {
      const { data } = await getBusinessUnitStores({ id: businessUnitId });

      if (data?.businessUnit?.stores) {
        // Cache the stores for this business unit
        setBusinessUnitStoresCache((prev) => ({
          ...prev,
          [businessUnitId]: data.businessUnit.stores,
        }));

        return data.businessUnit.stores;
      }

      return undefined;
    } catch (error) {
      console.error(
        `Error fetching stores for business unit ${businessUnitId}`
      );
      return undefined;
    }
  };

  // Update auth context with store information more efficiently
  const updateStoreContext = useCallback(
    async (businessUnit: BusinessUnit) => {
      if (!businessUnit) return;

      try {
        // If we already processed this business unit ID, don't do it again
        if (previousBusinessUnitIdRef.current === businessUnit.id) {
          return;
        }

        setIsContextLoading(true);
        // Set the ref before async operations to prevent duplicates
        previousBusinessUnitIdRef.current = businessUnit.id;

        // Get stores from cache or fetch them
        let stores =
          businessUnitStoresCache[businessUnit.id] ||
          (await fetchStoreInfo(businessUnit.id));

        if (stores && stores.length > 0) {
          // Always use the first store key as the active store for simplicity
          const storeKey = stores[0].key;
          const storeName = stores[0].name;
          const distributionChannelId = stores[0].distributionChannels?.[0]?.id;
          const supplyChannelId = stores[0].supplyChannels?.[0]?.id;

          console.log(
            `Active store: "${storeName}" (${storeKey}) for business unit "${businessUnit.name}"`
          );

          // Update auth context with the store key
          if (isLoggedIn && activeStoreKey) {
            // Only update if the store key has changed
            if (activeStoreKey !== storeKey) {
              setStoreKey(storeKey);
              setDistributionChannelId(distributionChannelId);
              setSupplyChannelId(supplyChannelId);
            }
          } else if (isLoggedIn && !activeStoreKey) {
            setStoreKey(storeKey);
            setDistributionChannelId(distributionChannelId);
            setSupplyChannelId(supplyChannelId);
          }
        } else {
          console.warn(
            `No stores found for business unit ${businessUnit.name}`
          );
        }
      } catch (error) {
        console.error('Error updating store context');
      } finally {
        setIsContextLoading(false);
      }
    },
    [
      isLoggedIn,
      businessUnitStoresCache,
      fetchStoreInfo,
      setStoreKey,
      activeStoreKey,
      setDistributionChannelId,
      setSupplyChannelId,
    ]
  );

  // Custom selectBusinessUnit function that also updates the storage
  const handleSelectBusinessUnit = useCallback(
    (businessUnitId: string) => {
      // Prevent selecting the already selected business unit
      if (selectedBusinessUnit?.id === businessUnitId) {
        return;
      }

      // Find the business unit in our list
      const businessUnit = businessUnits.find((bu) => bu.id === businessUnitId);
      if (!businessUnit) {
        console.warn(`Business unit with ID ${businessUnitId} not found`);
        return;
      }

      selectBusinessUnit(businessUnitId);

      try {
        sessionStorage.setItem(BU_STORAGE_KEY, businessUnitId);
      } catch (error) {
        console.error('Failed to save selected business unit to storage');
      }
    },
    [businessUnits, selectedBusinessUnit, selectBusinessUnit]
  );

  const updateProductSelection = useCallback(
    async (storeKey: string) => {
      const productSelectionId = await getProductSelectionByStoreKey(storeKey);
      setProductSelectionId(productSelectionId);
    },
    [getProductSelectionByStoreKey]
  );

  const getMasterProductSelectionAndStore = async () => {
    const result = await getCustomObject(PRODUCT_SELECTION_KEY);
    const storeKey = await getCustomObject(STORE_KEY);
    if (storeKey?.value) {
      const store = await getStoreByKey(storeKey.value);
      if (store) {
        setMasterDistributionChannelId(store.distributionChannels?.[0].id);
      }
    }
    setMasterProductSelectionId(result?.value);
    setMasterStoreKey(storeKey?.value);
  };

  // Load business units when the user is logged in
  useEffect(() => {
    if (isLoggedIn && customerDetails?.id) {
      fetchBusinessUnitsByCustomerId(customerDetails.id);
    }
  }, [isLoggedIn, customerDetails, fetchBusinessUnitsByCustomerId]);

  // Handle business unit selection
  useEffect(() => {
    if (businessUnits.length > 0 && !selectedBusinessUnit) {
      // If no business unit is selected, select the first one
      selectBusinessUnit(businessUnits[0].id);
      console.log('Selected business unit:', businessUnits[0]);

      try {
        // Save this selection to session storage
        sessionStorage.setItem(BU_STORAGE_KEY, businessUnits[0].id);
      } catch (error) {
        console.error('Failed to save business unit selection to storage');
      }
    }
  }, [businessUnits, selectedBusinessUnit, selectBusinessUnit]);

  // Fetch store information when the selected business unit changes
  useEffect(() => {
    if (selectedBusinessUnit) {
      updateStoreContext(selectedBusinessUnit);
    }
  }, [selectedBusinessUnit, updateStoreContext]);

  useEffect(() => {
    if (activeStoreKey) {
      updateProductSelection(activeStoreKey);
    }
  }, [activeStoreKey, updateProductSelection]);

  useEffect(() => {
    getMasterProductSelectionAndStore();
  }, []);

  // Context value memoized to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      businessUnits,
      selectedBusinessUnit,
      loading: isContextLoading || loading,
      error,
      selectBusinessUnit: handleSelectBusinessUnit,
      updateBusinessUnit,
    }),
    [
      businessUnits,
      selectedBusinessUnit,
      loading,
      error,
      isContextLoading,
      handleSelectBusinessUnit,
      updateBusinessUnit,
    ]
  );

  return (
    <BusinessUnitContext.Provider value={contextValue}>
      {children}
    </BusinessUnitContext.Provider>
  );
};

export const useBusinessUnitContext = () => useContext(BusinessUnitContext);

export default BusinessUnitContext;
