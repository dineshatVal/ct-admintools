import { useIsAuthorized } from '@commercetools-frontend/permissions';
import type { ReactNode } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { PERMISSIONS } from '../constants';
import AdminRoutes from './admin-routes';
import DashboardRoutes from './dashboard-routes';
import { ErrorMessage } from '@commercetools-uikit/messages';

type ApplicationRoutesProps = {
  children?: ReactNode;
};
const ApplicationRoutes = (_props: ApplicationRoutesProps) => {
  const match = useRouteMatch();
  const isManageAdmin = true;

  return (
    <Switch>
      <Route path={`${match.path}/admin`}>
        {isManageAdmin ? (
          <AdminRoutes />
        ) : (
          <ErrorMessage>
            You are not authorized to access this page
          </ErrorMessage>
        )}
      </Route>
      <Route path={`${match.path}`}>
        <DashboardRoutes />
      </Route>
    </Switch>
  );
};
ApplicationRoutes.displayName = 'ApplicationRoutes';

export default ApplicationRoutes;
