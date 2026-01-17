import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import { ErrorMessage } from '@commercetools-uikit/messages';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { CUSTOMER_GROUP_KEY, SHARED_CONTAINER } from '../../constants';
import { useCustomObject } from '../hooks/use-custom-objects';
import useCustomerAuth from '../hooks/use-customer-auth/use-customer-auth';
import useCustomerDetails from '../hooks/use-customer-details/use-customer-details';
import { TCustomer } from '../../types/generated/ctp';
// Type for customer details in the context
export type CustomerDetails = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

export const convertToCustomerDetails = (
  customer: TCustomer
): CustomerDetails => {
  return {
    id: customer.id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
  };
};

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  storeKey: string | null;
  distributionChannelId: string | null;
  supplyChannelId: string | null;
  masterDistributionChannelId: string | null;
  masterStoreKey: string | null;
  setMasterStoreKey: (masterStoreKey: string) => void;
  setStoreKey: (storeKey: string) => void;
  setDistributionChannelId: (distributionChannelId: string) => void;
  setSupplyChannelId: (supplyChannelId: string) => void;
  setMasterDistributionChannelId: (masterDistributionChannelId: string) => void;
  customerDetails: CustomerDetails | null;
  productSelectionId: string | undefined;
  masterProductSelectionId: string | undefined;
  setProductSelectionId: (productSelectionId?: string) => void;
  setMasterProductSelectionId: (masterProductSelectionId?: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isLoading: false,
  storeKey: null,
  distributionChannelId: null,
  supplyChannelId: null,
  masterDistributionChannelId: null,
  masterStoreKey: null,
  setMasterStoreKey: () => {},
  setStoreKey: () => {},
  setDistributionChannelId: () => {},
  setSupplyChannelId: () => {},
  setMasterDistributionChannelId: () => {},
  customerDetails: null,
  productSelectionId: undefined,
  masterProductSelectionId: undefined,
  setProductSelectionId: () => {},
  setMasterProductSelectionId: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [storeKey, setStoreKey] = useState<string | null>(null);
  const [distributionChannelId, setDistributionChannelId] = useState<
    string | null
  >(null);
  const [supplyChannelId, setSupplyChannelId] = useState<string | null>(null);
  const [productSelectionId, setProductSelectionId] = useState<
    string | undefined
  >(undefined);
  const [masterProductSelectionId, setMasterProductSelectionId] = useState<
    string | undefined
  >(undefined);
  const [masterDistributionChannelId, setMasterDistributionChannelId] =
    useState<string | null>(null);
  const [masterStoreKey, setMasterStoreKey] = useState<string | null>(null);
  const [customerDetails, setCustomerDetails] =
    useState<CustomerDetails | null>(null);
  const [customerGroupKey, setCustomerGroupKey] = useState<string | undefined>(
    undefined
  );
  const { getCustomObject } = useCustomObject(SHARED_CONTAINER);
  const { fetchCustomerGroup } = useCustomerDetails();

  const {
    mcLoggedInUserLoading,
    mcLoggedInUserError,
    mcLoggedInUser,
    findCustomerByEmail,
    findCustomerByEmailLoading,
  } = useCustomerAuth();

  useEffect(() => {
    if (mcLoggedInUser && mcLoggedInUser.user?.id && customerGroupKey) {
      findCustomerByEmail({
        variables: {
          where: `email = "${mcLoggedInUser.user.email}"`,
        },
      }).then((result) => {
        const customer = result.data?.customers?.results?.[0];
        if (customer) {
          const customerGroupAssignments =
            result.data?.customers?.results?.[0].customerGroupAssignments;
          const isSeller =
            customerGroupAssignments?.some(
              (assignment) => assignment.customerGroup.key === customerGroupKey
            ) ||
            result.data?.customers?.results?.[0].customerGroup?.key ===
              customerGroupKey;
          setIsLoggedIn(!!isSeller);
          setCustomerDetails(convertToCustomerDetails(customer));
        }
      });
    }
  }, [mcLoggedInUser, customerGroupKey]);

  useEffect(() => {
    if (mcLoggedInUser && mcLoggedInUser.user?.id) {
      getCustomObject(CUSTOMER_GROUP_KEY).then((result) => {
        const customerGroupId = result?.value;
        if (customerGroupId) {
          fetchCustomerGroup(customerGroupId).then((customerGroup) => {
            if (customerGroup) {
              setCustomerGroupKey(customerGroup.key);
            }
          });
        }
      });
    }
  }, [mcLoggedInUser]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      isLoggedIn,
      isLoading: mcLoggedInUserLoading || findCustomerByEmailLoading,
      customerDetails,
      storeKey,
      productSelectionId,
      distributionChannelId,
      supplyChannelId,
      masterStoreKey,
      masterProductSelectionId,
      masterDistributionChannelId,
      setStoreKey,
      setProductSelectionId,
      setDistributionChannelId,
      setSupplyChannelId,
      setMasterStoreKey,
      setMasterProductSelectionId,
      setMasterDistributionChannelId,
    }),
    [
      isLoggedIn,
      customerDetails,
      storeKey,
      productSelectionId,
      distributionChannelId,
      masterDistributionChannelId,
      masterProductSelectionId,
      masterStoreKey,
      supplyChannelId,
      setDistributionChannelId,
      setSupplyChannelId,
      setMasterDistributionChannelId,
      setStoreKey,
      setProductSelectionId,
      setMasterProductSelectionId,
      setMasterStoreKey,
    ]
  );

  if (mcLoggedInUserLoading || findCustomerByEmailLoading) {
    return <LoadingSpinner />;
  }

  if (mcLoggedInUserError) {
    return (
      <ErrorMessage>
        Error loading user: {mcLoggedInUserError.message}
      </ErrorMessage>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);

export default AuthContext;
