import { ErrorMessage } from '@commercetools-uikit/messages';
import PrimaryButton from '@commercetools-uikit/primary-button';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import { CMS_DEPLOYED_URL_KEY } from '../../../constants';
import ContentType from '@commercetools-demo/contentools-content-types';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { useHistory, useRouteMatch } from 'react-router-dom';
import styled from 'styled-components';
import { useExternalUrl } from '../../../dashboard/hooks/use-external-url';

const StyledHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-l);
  padding-bottom: var(--spacing-m);
  border-bottom: 1px solid var(--color-neutral-60);
`;

type Props = {
  linkToWelcome: string;
};

const ManageContentools = ({ linkToWelcome }: Props) => {
  const match = useRouteMatch();
  const history = useHistory();
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
        <div>
          <Text.Headline as="h1">Manage Contentools</Text.Headline>
        </div>
        <Spacings.Inline scale="s">
          <PrimaryButton
            label="Back to Dashboard"
            onClick={() => history.push(linkToWelcome)}
          />
        </Spacings.Inline>
      </StyledHeader>
      <ContentType
        businessUnitKey="default"
        baseURL={deployedUrl}
        locale={dataLocale ?? 'en-US'}
        parentUrl={`${match.url}`.slice(1)}
      />
    </Spacings.Stack>
  );
};

export default ManageContentools;
