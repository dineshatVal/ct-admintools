import * as dotenv from 'dotenv';
dotenv.config();

export const MAX_VERSIONS = parseInt(process.env.MAX_VERSIONS || '5', 10);

export const CONTENT_ITEM_CONTAINER =
  process.env.CONTENT_ITEM_CONTAINER || 'content-item';

export const CONTENT_ITEM_STATE_CONTAINER =
  process.env.CONTENT_ITEM_STATE_CONTAINER || 'content-item-state';

export const CONTENT_ITEM_VERSION_CONTAINER =
  process.env.CONTENT_ITEM_VERSION_CONTAINER || 'content-item-version';

export const CONTENT_TYPE_CONTAINER =
  process.env.CONTENT_TYPE_CONTAINER || 'content-type';

export const DATASOURCE_CONTAINER =
  process.env.DATASOURCE_CONTAINER || 'datasource';

export const SHARED_CONTAINER = 'shared-sellertools-container';
export const CMS_DEPLOYED_URL_KEY = 'cms-app-deployed-url';

export const PAGE_VERSION_CONTAINER =
  process.env.PAGE_VERSION_CONTAINER || 'page-version';

export const PAGE_STATE_CONTAINER =
  process.env.PAGE_STATE_CONTAINER || 'page-state';

export const CONTENT_PAGE_CONTAINER =
  process.env.CONTENT_PAGE_CONTAINER || 'content-page';

export const PAGE_CONTENT_ITEMS_CONTAINER =
  process.env.PAGE_CONTENT_ITEMS_CONTAINER || 'page-content-items';
export const PAGE_CONTENT_ITEM_STATE_CONTAINER =
  process.env.PAGE_CONTENT_ITEM_STATE_CONTAINER || 'page-content-item-state';
export const PAGE_CONTENT_ITEM_VERSION_CONTAINER =
  process.env.PAGE_CONTENT_ITEM_VERSION_CONTAINER ||
  'page-content-item-version';

export const NUMBER_OF_COLUMNS = parseInt(
  process.env.NUMBER_OF_COLUMNS || '12',
  10
);
