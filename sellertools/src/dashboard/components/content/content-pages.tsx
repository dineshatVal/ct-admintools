import { ErrorMessage } from '@commercetools-uikit/messages';
import PrimaryButton from '@commercetools-uikit/primary-button';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import { CMS_DEPLOYED_URL_KEY } from '../../../constants';
import { useAuthContext } from '../../contexts/auth-context';
import { useExternalUrl } from '../../hooks/use-external-url';
import ContentPage from '@commercetools-demo/contentools-content-pages';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { useRouteMatch } from 'react-router-dom';
import styled from 'styled-components';

const StyledHeader = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: var(--spacing-l);
  padding-bottom: var(--spacing-m);
`;

type Props = {
  onBack: () => void;
  linkToWelcome: string;
};

const ContentPages = ({ onBack }: Props) => {
  const match = useRouteMatch();

  const { storeKey } = useAuthContext();
  const { dataLocale } = useApplicationContext();
  const isDevelopment = process.env.NODE_ENV === 'development';
  const { deployedUrl, isLoading, isHealthy } = useExternalUrl({
    storedUrlKey: isDevelopment
      ? 'http://localhost:8080/service'
      : CMS_DEPLOYED_URL_KEY,
    healthCheckUrl: `/health`,
    healthCheckHeaders: {},
  });

  if (isLoading) {
    return null;
  }

  if (!isHealthy || !deployedUrl) {
    return (
      <ErrorMessage>
        The content service is not available. Please contact support.
      </ErrorMessage>
    );
  }

  return (
    <Spacings.Stack scale="l">
      <StyledHeader>
          <PrimaryButton label="Back to Dashboard" onClick={onBack} />
      </StyledHeader>
      {storeKey && (
        <ContentPage
          baseURL={deployedUrl}
          businessUnitKey={storeKey}
          locale={dataLocale ?? 'en-US'}
          parentUrl={`${match.url}`.slice(1)}
        />
      )}
    </Spacings.Stack>
  );
};

export default ContentPages;
