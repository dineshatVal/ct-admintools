import { lazy } from 'react';

const OnboardSeller = lazy(
  () => import('./onboard-seller' /* webpackChunkName: "onboard-seller" */)
);

export default OnboardSeller;
