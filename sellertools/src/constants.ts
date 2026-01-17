// Make sure to import the helper functions from the `ssr` entry point.
import { entryPointUriPathToPermissionKeys } from '@commercetools-frontend/application-shell/ssr';

export const entryPointUriPath = 'clinictools';

export const groupNames = {
  admin: 'admin',
  dashboard: 'dashboard',
};
export const permissionGroups = ['admin', 'dashboard'];

export const PERMISSIONS = entryPointUriPathToPermissionKeys(
  entryPointUriPath,
  permissionGroups
);

export const SHARED_CONTAINER = 'shared-sellertools-container';
export const AI_ASSISTANT_DEPLOYED_URL_KEY = 'chat-app-deployed-url';
export const CMS_DEPLOYED_URL_KEY = 'cms-app-deployed-url';
export const PRODUCT_SELECTION_KEY = 'main-catalog-product-selection';
export const CUSTOMER_GROUP_KEY = 'seller-customer-group';
export const STORE_KEY = 'main-catalog-store';
export const FEATURE_FLAGS_KEY = 'feature-flags';
export const FEATURE_FLAG_VET_KEY = 'vet-store';
