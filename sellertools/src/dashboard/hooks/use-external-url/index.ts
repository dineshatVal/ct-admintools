import { useCallback, useEffect, useState } from 'react';
import { SHARED_CONTAINER } from '../../../constants';
import { useCustomObject } from '../use-custom-objects';
import axios from 'axios';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';

export const useExternalUrl = ({
  storedUrlKey,
  healthCheckUrl,
  healthCheckHeaders,
}: {
  storedUrlKey: string;
  healthCheckUrl?: string;
  healthCheckHeaders?: Record<string, string>;
}) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const { getCustomObject } = useCustomObject(SHARED_CONTAINER);
  const [deployedUrl, setDeployedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHealthy, setIsHealthy] = useState(isDevelopment);
  const { project } = useApplicationContext();

  const fetchDeployedUrl = useCallback(async () => {
    if (isDevelopment) {
      // Use the key as the deployed URL for development
      setDeployedUrl(storedUrlKey);
      setIsLoading(false);
      return;
    }
    try {
      const deployedUrlResult = await getCustomObject(storedUrlKey);
      setDeployedUrl(deployedUrlResult?.value);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching deployed URL:', error);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  }, [getCustomObject]);

  const checkHealth = useCallback(async (): Promise<boolean> => {
    if (!deployedUrl) {
      return false;
    }
    try {
      const result = await axios.get(`${deployedUrl}${healthCheckUrl}`, {
        headers: healthCheckHeaders,
      });
      if (result.status !== 200 || result.data.projectkey !== project?.key) {
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }, [deployedUrl, healthCheckUrl, healthCheckHeaders, project]);

  useEffect(() => {
    fetchDeployedUrl();
  }, [fetchDeployedUrl]);

  useEffect(() => {
    if (deployedUrl && healthCheckUrl && healthCheckHeaders) {
      checkHealth().then((isHealthy) => {
        setIsHealthy(isHealthy);
      });
    }
  }, [
    deployedUrl,
    isDevelopment,
    healthCheckHeaders,
    healthCheckUrl,
    checkHealth,
  ]);

  return { deployedUrl, isLoading, isHealthy, checkHealth };
};
