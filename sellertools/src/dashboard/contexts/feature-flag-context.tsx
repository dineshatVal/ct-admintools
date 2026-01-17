import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { FEATURE_FLAGS_KEY, SHARED_CONTAINER } from '../../constants';
import { useCustomObject } from '../hooks/use-custom-objects';
// Type for customer details in the context
export type CustomerDetails = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

interface FeatureFlagContextType {
  featureFlags: Record<string, boolean>;
}

const FeatureFlagContext = createContext<FeatureFlagContextType>({
  featureFlags: {},
});

interface FeatureFlagProviderProps {
  children: ReactNode;
}

export const FeatureFlagProvider: React.FC<FeatureFlagProviderProps> = ({
  children,
}) => {
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({});
  const { getCustomObject } = useCustomObject(SHARED_CONTAINER);

  useEffect(() => {
    getCustomObject(FEATURE_FLAGS_KEY).then((result) => {
      setFeatureFlags(result?.value || {});
    });
  }, [getCustomObject]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      featureFlags,
    }),
    [featureFlags]
  );

  return (
    <FeatureFlagContext.Provider value={contextValue}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

export const useFeatureFlagContext = () => useContext(FeatureFlagContext);

export default FeatureFlagContext;
