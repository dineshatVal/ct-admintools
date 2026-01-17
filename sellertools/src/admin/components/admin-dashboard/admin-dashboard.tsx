import React from 'react';
import { useIntl } from 'react-intl';
import { useHistory, useRouteMatch } from 'react-router-dom';
import {
  UsersIcon,
  MailIcon,
  GearIcon,
  FrontendStudioIcon,
} from '@commercetools-uikit/icons';
import Text from '@commercetools-uikit/text';
import messages from './messages';
import styles from './admin-dashboard.module.css';
import { DashboardCard } from '../../../dashboard/components/dashboard-card';
import { useExternalUrl } from '../../../dashboard/hooks/use-external-url';
import { CMS_DEPLOYED_URL_KEY } from '../../../constants';

const AdminDashboard = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const { checkHealth: checkHealthCms } = useExternalUrl({
    storedUrlKey: isDevelopment
      ? 'http://localhost:8080/service'
      : CMS_DEPLOYED_URL_KEY,
    healthCheckUrl: `/health`,
    healthCheckHeaders: {},
  });
  const intl = useIntl();
  const history = useHistory();
  const match = useRouteMatch();

  const handleOnboardSeller = () => {
    history.push(`${match.url}/onboard-seller`);
  };

  const handleManageInvites = () => {
    history.push(`${match.url}/manage-invites`);
  };

  const handleManageSellertools = () => {
    history.push(`${match.url}/manage-sellertools`);
  };

  const handleManageFeatureFlags = () => {
    history.push(`${match.url}/manage-feature-flags`);
  };

  const handleManageContentools = () => {
    history.push(`${match.url}/manage-contentools`);
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.headerContainer}>
        <div className={styles.dashboardTitle}>
          <Text.Headline as="h1" intlMessage={messages.title} />
        </div>
      </div>
      <div className={styles.dashboardGrid}>
        <DashboardCard
          title={intl.formatMessage(messages.onboardSeller)}
          icon={<UsersIcon size="big" color="surface" />}
          onClick={handleOnboardSeller}
        />
        {/* <DashboardCard
          title="Manage Invites"
          icon={<MailIcon size="big" color="surface" />}
          onClick={handleManageInvites}
        /> */}
        {/* <DashboardCard
          title="Manage Sellertools"
          icon={<GearIcon size="big" color="surface" />}
          onClick={handleManageSellertools}
        /> */}
        {/* <DashboardCard
          title="Manage Feature Flags"
          icon={<GearIcon size="big" color="surface" />}
          onClick={handleManageFeatureFlags}
        /> */}
        {/* <DashboardCard
          title="Manage contentools"
          icon={<FrontendStudioIcon size="big" color="surface" />}
          onClick={handleManageContentools}
          checkVisibility={checkHealthCms}
        /> */}
      </div>
    </div>
  );
};
AdminDashboard.displayName = 'AdminDashboard';

export default AdminDashboard;
