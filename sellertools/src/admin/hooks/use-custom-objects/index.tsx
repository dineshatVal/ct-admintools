import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import {
  actions,
  TSdkAction,
  useAsyncDispatch,
} from '@commercetools-frontend/sdk';
import { MC_API_PROXY_TARGETS } from '@commercetools-frontend/constants';
import { useCallback } from 'react';
import {
  SHARED_CONTAINER,
  PRODUCT_SELECTION_KEY,
  CUSTOMER_GROUP_KEY,
  STORE_KEY,
  FEATURE_FLAGS_KEY,
} from '../../../constants';

interface CommercetoolsError {
  statusCode: number;
  message: string;
}

export const useCustomObject = () => {
  const context = useApplicationContext((context) => context);
  const dispatchAppsRead = useAsyncDispatch<TSdkAction, any>();

  const setCustomObject = useCallback(
    async (key: string, value: string | boolean) => {
      try {
        await dispatchAppsRead(
          actions.post({
            mcApiProxyTarget: MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM,
            uri: `/${context?.project?.key}/custom-objects`,
            payload: {
              container: SHARED_CONTAINER,
              key: key,
              value: value,
            },
          })
        );
      } catch (error) {
        console.warn(`Failed to set custom object: ${error}`);
      }
    },
    [context?.project?.key, dispatchAppsRead]
  );

  const getCustomObject = useCallback(
    async (key: string) => {
      try {
        const result = await dispatchAppsRead(
          actions.get({
            mcApiProxyTarget: MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM,
            uri: `/${context?.project?.key}/custom-objects/${SHARED_CONTAINER}/${key}`,
          })
        );

        return result;
      } catch (error) {
        const apiError = error as CommercetoolsError;
        if (apiError.statusCode === 404) {
          console.warn(`Custom object not found with key: ${key}`);
        }
        console.warn(`Failed to get custom object: ${apiError.message}`);
        return null;
      }
    },
    [context?.project?.key, dispatchAppsRead]
  );

  const getSelectedProductSelection = useCallback(async () => {
    const result = await getCustomObject(PRODUCT_SELECTION_KEY);
    if (result && result.value && typeof result.value === 'string') {
      return result.value;
    }
    return null;
  }, [getCustomObject]);

  const getSelectedCustomerGroup = useCallback(async () => {
    const result = await getCustomObject(CUSTOMER_GROUP_KEY);
    if (result && result.value && typeof result.value === 'string') {
      return result.value;
    }
    return null;
  }, [getCustomObject]);

  const getSelectedStore = useCallback(async () => {
    const result = await getCustomObject(STORE_KEY);
    if (result && result.value && typeof result.value === 'string') {
      return result.value;
    }
    return null;
  }, [getCustomObject]);

  const setSellertoolsContext = useCallback(
    async (
      productSelection: string,
      customerGroup: string,
      storeKey: string
    ) => {
      await setCustomObject(PRODUCT_SELECTION_KEY, productSelection);
      await setCustomObject(CUSTOMER_GROUP_KEY, customerGroup);
      await setCustomObject(STORE_KEY, storeKey);
    },
    [setCustomObject]
  );

  const getFeatureFlags = useCallback(async () => {
    const result = await getCustomObject(FEATURE_FLAGS_KEY);
    return result?.value || {};
  }, [getCustomObject]);

  const setFeatureFlagsContext = useCallback(
    async (featureflags: Record<string, boolean>) => {
      getFeatureFlags().then((currentFlags) => {
        return setCustomObject(FEATURE_FLAGS_KEY, {
          ...currentFlags,
          ...featureflags,
        });
      });
    },
    [setCustomObject, getFeatureFlags]
  );

  return {
    getSelectedProductSelection,
    getSelectedCustomerGroup,
    getSelectedStore,
    setSellertoolsContext,
    getFeatureFlags,
    setFeatureFlagsContext,
  };
};
