import {
  CartIcon,
  CoinsIcon,
  FrontendStudioIcon,
  GearIcon,
  GraphIcon,
  GridIcon,
  ListWithSearchIcon,
  TagIcon,
  UsersIcon,
} from '@commercetools-uikit/icons';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import SelectField from '@commercetools-uikit/select-field';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import React, { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { CMS_DEPLOYED_URL_KEY } from '../../../constants';
import { useBusinessUnitContext } from '../../contexts/business-unit-context';
import { useExternalUrl } from '../../hooks/use-external-url';
import { DashboardCard } from '../dashboard-card';
import messages from './messages';
import styles from './seller-dashboard.module.css';

type SellerDashboardProps = {
  onNavigate: (route: string) => void;
};

// Define the custom event type for SelectField
type TCustomEvent = {
  target: {
    id?: string;
    name?: string;
    value?: string | string[] | null;
  };
  persist: () => void;
};

const SellerDashboard: React.FC<SellerDashboardProps> = ({ onNavigate }) => {
  const intl = useIntl();
  const {
    businessUnits,
    selectedBusinessUnit,
    loading,
    error,
    selectBusinessUnit,
  } = useBusinessUnitContext();
  const isDevelopment = process.env.NODE_ENV === 'development';
  const { checkHealth: checkHealthCms } = useExternalUrl({
    storedUrlKey: isDevelopment
      ? 'http://localhost:8080/service'
      : CMS_DEPLOYED_URL_KEY,
    healthCheckUrl: `/health`,
    healthCheckHeaders: {},
  });

  const handleNavigate = (route: string) => {
    onNavigate(route);
  };

  // Memoize business unit options to prevent unnecessary re-renders
  const businessUnitOptions = useMemo(() => {
    return businessUnits.map((bu) => ({
      label: bu.name,
      value: bu.id,
    }));
  }, [businessUnits]);

  const handleBusinessUnitChange = (event: TCustomEvent) => {
    const businessUnitId = event.target.value as string;
    if (businessUnitId) {
      // Only update if value has changed
      if (businessUnitId !== selectedBusinessUnit?.id) {
        selectBusinessUnit(businessUnitId);
      }
    }
  };

  // Dashboard items with UI Kit icons
  const dashboardItems = [
    {
      id: 'orders',
      title: intl.formatMessage(messages.viewOrders),
      icon: <CartIcon size="big" color="surface" />,
      onClick: () => handleNavigate('/orders'),
    },
    {
      id: 'customers',
      title: intl.formatMessage(messages.manageCustomers),
      icon: <UsersIcon size="big" color="surface" />,
      onClick: () => handleNavigate('/customers'),
    },
    {
      id: 'products',
      title: intl.formatMessage(messages.selectProducts),
      icon: <ListWithSearchIcon size="big" color="surface" />,
      onClick: () => handleNavigate('/products'),
    },
    {
      id: 'prices',
      title: intl.formatMessage(messages.managePrices),
      icon: <CoinsIcon size="big" color="surface" />,
      onClick: () => handleNavigate('/prices'),
    },
    // Temporarily hiding price list management card
    // {
    //   id: 'pricelists',
    //   title: intl.formatMessage(messages.managePriceLists),
    //   icon: <CoinsIcon />,
    //   onClick: () => handleNavigate('/price-lists'),
    // },
    {
      id: 'promotions',
      title: intl.formatMessage(messages.managePromotions),
      icon: <TagIcon size="big" color="surface" />,
      onClick: () => handleNavigate('/promotions'),
    },
    {
      id: 'content-items',
      title: intl.formatMessage(messages.manageContentItems),
      icon: <FrontendStudioIcon size="big" color="surface" />,
      onClick: () => handleNavigate('/content-items'),
      checkVisibility: checkHealthCms,
    },
    {
      id: 'content-pages',
      title: intl.formatMessage(messages.manageContentPages),
      icon: <GridIcon size="big" color="surface" />,
      onClick: () => handleNavigate('/content-pages'),
      checkVisibility: checkHealthCms,
    },
    {
      id: 'reports',
      title: intl.formatMessage(messages.viewReports),
      icon: <GraphIcon size="big" color="surface" />,
      onClick: () => handleNavigate('/reports'),
    },
    {
      id: 'configuration',
      title: intl.formatMessage(messages.storeConfiguration),
      icon: <GearIcon size="big" color="surface" />,
      onClick: () => handleNavigate('/configuration'),
    },
  ];

  return (
    <div className={styles.dashboardContainer}>
      <Spacings.Stack scale="xl">
        <div className={styles.headerContainer}>
          <div className={styles.dashboardTitle}>
            <Text.Headline as="h1">
              {intl.formatMessage(messages.title)}
            </Text.Headline>
          </div>
        </div>

        <div className={styles.businessUnitContainer}>
          {loading ? (
            <Spacings.Inline alignItems="center">
              <LoadingSpinner />
              <Text.Body>
                {intl.formatMessage(messages.loadingBusinessUnits)}
              </Text.Body>
            </Spacings.Inline>
          ) : businessUnits.length > 0 ? (
            <div className={styles.businessUnitSelector}>
              <SelectField
                title={intl.formatMessage(messages.businessUnitSelector)}
                name="businessUnitSelector"
                value={selectedBusinessUnit?.id || ''}
                options={businessUnitOptions}
                onChange={handleBusinessUnitChange}
                horizontalConstraint={13}
                iconLeft={<UsersIcon />}
              />
            </div>
          ) : (
            <Text.Body>
              {intl.formatMessage(messages.noBusinessUnits)}
            </Text.Body>
          )}
        </div>

        <div className={styles.dashboardGrid}>
          {dashboardItems.map((item) => (
            <DashboardCard
              key={item.id}
              title={item.title}
              icon={item.icon}
              onClick={item.onClick}
              checkVisibility={item.checkVisibility}
            />
          ))}
        </div>
      </Spacings.Stack>
    </div>
  );
};

export default SellerDashboard;
