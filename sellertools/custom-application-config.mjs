import { PERMISSIONS } from './src/constants';

/**
 * @type {import('@commercetools-frontend/application-config').ConfigOptionsForCustomApplication}
 */
const config = {
  name: 'clinictools',
  entryPointUriPath: '${env:ENTRY_POINT_URI_PATH}',
  cloudIdentifier: '${env:CLOUD_IDENTIFIER}',
  env: {
    production: {
      applicationId: '${env:CUSTOM_APPLICATION_ID}',
      url: '${env:APPLICATION_URL}',
    },
    development: {
      initialProjectKey: '${env:INITIAL_PROJECT_KEY}',
    },
  },
  additionalEnv: {
    JWT_TOKEN: '${env:JWT_TOKEN}',
    ASSOCIATE_ROLE: '${env:ASSOCIATE_ROLE}',
    MC_TEAM_NAME: '${env:MC_TEAM_NAME}',
    CUSTOMER_GROUP: '${env:CUSTOMER_GROUP}',
  },
  headers: {
    csp: {
      'connect-src': [
        '*.commercetools.app',
        'localhost:8080',
        "'unsafe-eval'",
      ],
      'script-src': [
        '*.commercetools.app',
        'localhost:8080',
        'cdn.jsdelivr.net',
        'blob:',
        "'unsafe-eval'",
      ],
      'style-src': [
        'cdn.jsdelivr.net',
      ],
      'font-src': [
        'cdn.jsdelivr.net',
      ],
    },
  },
  oAuthScopes: {
    view: [
      'view_products',
      'view_customers',
      'view_stores',
      'view_orders',
      'view_product_selections',
      'view_cart_discounts',
      'view_business_units',
      'view_key_value_documents',
      'view_customer_groups',
      'view_associate_roles',
    ],
    manage: [
      'manage_products',
      'manage_customers',
      'manage_stores',
      'manage_orders',
      'manage_product_selections',
      'manage_cart_discounts',
      'manage_business_units',
      'manage_associate_roles',
      'manage_key_value_documents',
    ],
  },
  additionalOAuthScopes: [
    {
      name: 'dashboard',
      view: [
        'view_products',
        'view_customers',
        'view_stores',
        'view_orders',
        'view_product_selections',
        'view_cart_discounts',
        'view_business_units',
        'view_key_value_documents',
        'view_customer_groups',
        'view_associate_roles',
      ],
      manage: [
        'manage_products',
        'manage_customers',
        'manage_stores',
        'manage_orders',
        'manage_product_selections',
        'manage_cart_discounts',
        'manage_business_units',
        'manage_associate_roles',
        'manage_key_value_documents',
      ],
    },
    {
      name: 'admin',
      view: [
        'view_products',
        'view_customers',
        'view_stores',
        'view_orders',
        'view_product_selections',
        'view_cart_discounts',
        'view_business_units',
        'view_key_value_documents',
        'view_customer_groups',
        'view_associate_roles',
      ],
      manage: [
        'manage_products',
        'manage_customers',
        'manage_stores',
        'manage_orders',
        'manage_product_selections',
        'manage_cart_discounts',
        'manage_business_units',
        'manage_associate_roles',
        'manage_key_value_documents',
      ],
    },
  ],
  icon: '${path:@commercetools-frontend/assets/application-icons/rocket.svg}',
  mainMenuLink: {
    defaultLabel: 'Sellertools',
    labelAllLocales: [],
    permissions: [PERMISSIONS.ManageDashboard],
  },
  submenuLinks: [
    {
      uriPath: '/',
      defaultLabel: 'Dashboard',
      permissions: [PERMISSIONS.ManageDashboard],
    },
    {
      uriPath: 'admin',
      defaultLabel: 'Admin',
      permissions: [PERMISSIONS.ManageAdmin],
    },
  ],
};

export default config;
