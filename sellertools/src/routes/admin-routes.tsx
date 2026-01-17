import type { ReactNode } from 'react';
import { Switch, Route, useRouteMatch } from 'react-router-dom';
import Spacings from '@commercetools-uikit/spacings';
import AdminDashboard from '../admin/components/admin-dashboard';
import OnboardSeller from '../admin/components/onboard-seller';
import ManageInvites from '../admin/components/manage-invites';
import ManageSellertools from '../admin/components/manage-sellertools';
import ManageFeatureFlags from '../admin/components/manage-feature-flags';
import ManageContentools from '../admin/components/manage-contentools';

type AdminRoutesProps = {
  children?: ReactNode;
};
const AdminRoutes = (_props: AdminRoutesProps) => {
  const match = useRouteMatch();
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
    <Spacings.Inset scale="l">
      <Switch>
        <Route path={`${match.path}/onboard-seller`}>
          <OnboardSeller />
        </Route>
        <Route path={`${match.path}/manage-invites`}>
          <ManageInvites />
        </Route>
        <Route path={`${match.path}/manage-sellertools`}>
          <ManageSellertools />
        </Route>
        <Route path={`${match.path}/manage-feature-flags`}>
          <ManageFeatureFlags />
        </Route>
        <Route path={`${match.path}/manage-contentools`}>
          <ManageContentools linkToWelcome={`${match.url}`} />
        </Route>
        <Route>
          <AdminDashboard />
        </Route>
      </Switch>
    </Spacings.Inset>
  );
};
AdminRoutes.displayName = 'AdminRoutes';

export default AdminRoutes;
