import { lazy } from 'react';

const AdminDashboard = lazy(
  () => import('./admin-dashboard' /* webpackChunkName: "admin-dashboard" */)
);

export default AdminDashboard;
