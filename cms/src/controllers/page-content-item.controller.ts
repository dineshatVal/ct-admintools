import { v4 as uuidv4 } from 'uuid';
import {
  MAX_VERSIONS,
  PAGE_CONTENT_ITEM_STATE_CONTAINER,
  PAGE_CONTENT_ITEM_VERSION_CONTAINER,
  PAGE_CONTENT_ITEMS_CONTAINER,
} from '../constants';
import {
  ContentItem,
  ContentItemState,
  ContentItemVersion,
} from './content-item.controller';
import { withDependencies as withContentStateDependencies } from './content-state-controller';
import { withDependencies as withContentVersionDependencies } from './content-version-controller';
import { CustomObjectController } from './custom-object.controller';
import * as ContentItemController from './content-item.controller';
import { CustomObject } from '@commercetools/platform-sdk';

const PageContentItemStateController =
  withContentStateDependencies<ContentItemState>({
    CONTENT_CONTAINER: PAGE_CONTENT_ITEMS_CONTAINER,
    CONTENT_STATE_CONTAINER: PAGE_CONTENT_ITEM_STATE_CONTAINER,
  });

const PageContentItemVersionController =
  withContentVersionDependencies<ContentItemVersion>({
    CONTENT_VERSION_CONTAINER: PAGE_CONTENT_ITEM_VERSION_CONTAINER,
    MAX_VERSIONS: MAX_VERSIONS,
  });
export const createPageContentItem = async (
  businessUnitKey: string,
  item: ContentItem['value']
): Promise<ContentItem> => {
  const key = `page-item-${uuidv4()}`;
  const contentItemController = new CustomObjectController(
    PAGE_CONTENT_ITEMS_CONTAINER
  );

  const object = await contentItemController.createCustomObject(key, {
    ...item,
    businessUnitKey,
    key,
  });

  await PageContentItemStateController.createDraftState(
    businessUnitKey,
    key,
    item
  );
  await PageContentItemVersionController.createContentVersion(
    businessUnitKey,
    key,
    item
  );
  return object;
};

export const updatePageContentItem = async (
  businessUnitKey: string,
  key: string,
  item: Partial<ContentItem['value']>
): Promise<ContentItem> => {
  const contentItemController = new CustomObjectController(
    PAGE_CONTENT_ITEMS_CONTAINER
  );

  const object = await contentItemController.updateCustomObject(key, {
    ...item,
    businessUnitKey,
  });
  await PageContentItemStateController.createDraftState(
    businessUnitKey,
    key,
    item
  );
  await PageContentItemVersionController.createContentVersion(
    businessUnitKey,
    key,
    item
  );
  return object;
};

export const deletePageContentItem = async (
  businessUnitKey: string,
  key: string
): Promise<CustomObject> => {
  const contentItemController = new CustomObjectController(
    PAGE_CONTENT_ITEMS_CONTAINER
  );
  const deletedContentItem =
    await contentItemController.deleteCustomObject(key);
  await PageContentItemStateController.deleteStates(businessUnitKey, key);
  await PageContentItemVersionController.deleteVersions(businessUnitKey, key);
  return deletedContentItem.body;
};

export const getContentItemWithStateKey = async (
  businessUnitKey: string,
  key: string,
  state: string | string[]
): Promise<ContentItem['value'] | undefined> => {
  const contentState =
    await PageContentItemStateController.getFirstContentWithState<
      ContentItem['value']
    >(`key = "${key}" AND businessUnitKey = "${businessUnitKey}"`, state);

  if (contentState) {
    return ContentItemController.resolveContentItemDatasource(contentState);
  }

  return undefined;
};
