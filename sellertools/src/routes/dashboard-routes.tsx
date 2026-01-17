import Spacings from '@commercetools-uikit/spacings';
import type { ReactNode } from 'react';
import App from '../dashboard/components/app';
import { AuthProvider } from '../dashboard/contexts/auth-context';
import { BusinessUnitProvider } from '../dashboard/contexts/business-unit-context';
import { FeatureFlagProvider } from '../dashboard/contexts/feature-flag-context';

type DashboardRoutesProps = {
  children?: ReactNode;
};
const DashboardRoutes = (_props: DashboardRoutesProps) => {
  /**
   * When using routes, there is a good chance that you might want to
   * restrict the access to a certain route based on the user permissions.
   * You can evaluate user permissions using the `useIsAuthorized` hook.
   * For more information see https://docs.commercetools.com/merchant-center-customizations/development/permissions
   *
   * NOTE that by default the Custom Application implicitly checks for a "View" permission,
   * otherwise it won't render. Therefore, checking for "View" permissions here
   * is redundant and not strictly necessary.
   */

  return (
    <AuthProvider>
      <BusinessUnitProvider>
        <FeatureFlagProvider>
          <Spacings.Inset scale="l">
            <App />
          </Spacings.Inset>
        </FeatureFlagProvider>
      </BusinessUnitProvider>
    </AuthProvider>
  );
};
DashboardRoutes.displayName = 'DashboardRoutes';

export default DashboardRoutes;
