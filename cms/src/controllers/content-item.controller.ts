import { v4 as uuidv4 } from 'uuid';
import {
  CONTENT_ITEM_CONTAINER,
  CONTENT_ITEM_STATE_CONTAINER,
  CONTENT_ITEM_VERSION_CONTAINER,
  CONTENT_TYPE_CONTAINER,
  MAX_VERSIONS,
} from '../constants';
import CustomError from '../errors/custom.error';
import { sampleContentTypeRegistry } from '../utils/constants';
import { logger } from '../utils/logger.utils';
import { withDependencies as withContentStateDependencies } from './content-state-controller';
import { withDependencies as withContentVersionDependencies } from './content-version-controller';
import { CustomObjectController } from './custom-object.controller';
import { resolveDatasource } from './datasource-resolution.route';

export interface ContentItemState {
  key: string;
  businessUnitKey: string;
  states: Record<string, any>;
}
export interface ContentItemVersion {
  key: string;
  businessUnitKey: string;
  versions: Array<ContentItem['value']>;
}

const ContentStateController = withContentStateDependencies<ContentItemState>({
  CONTENT_CONTAINER: CONTENT_ITEM_CONTAINER,
  CONTENT_STATE_CONTAINER: CONTENT_ITEM_STATE_CONTAINER,
});

const ContentVersionController =
  withContentVersionDependencies<ContentItemVersion>({
    CONTENT_VERSION_CONTAINER: CONTENT_ITEM_VERSION_CONTAINER,
    MAX_VERSIONS: MAX_VERSIONS,
  });

// Define types for our objects
export interface ContentItem {
  id: string;
  version: number;
  container: string;
  key: string;
  value: {
    key: string;
    type: string;
    businessUnitKey: string;
    properties: Record<string, any>;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface ContentType {
  id: string;
  version: number;
  container: string;
  key: string;
  value: {
    metadata: {
      propertySchema: Record<string, PropertySchema>;
    };
    [key: string]: any;
  };
  [key: string]: any;
}

export interface PropertySchema {
  type: string;
  datasourceType?: string;
  [key: string]: any;
}

export interface Datasource {
  id: string;
  version: number;
  container: string;
  key: string;
  value: {
    deployedUrl?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export const resolveContentItemDatasource = async (
  contentItem: ContentItem['value']
): Promise<ContentItem['value']> => {
  const contentTypeController = new CustomObjectController(
    CONTENT_TYPE_CONTAINER
  );
  // Get the content type associated with this content item
  try {
    const contentType = (await contentTypeController
      .getCustomObject(contentItem.type)
      .catch(async (error) => {
        const inSampleTypeRegistry =
          sampleContentTypeRegistry[contentItem.type];
        if (inSampleTypeRegistry) {
          return inSampleTypeRegistry;
        }
        throw new CustomError(500, 'Failed to get content type');
      })) as ContentType;
    // If content type exists, resolve any datasource properties
    if (contentType) {
      return resolveDatasourceProperties(contentItem, contentType);
    }
  } catch (error) {
    logger.error(`Failed to get content type for item`, error);
    // Continue and return the original content item if content type not found
  }
  return contentItem;
};

/**
 * Helper function to process and resolve datasource properties
 * @param contentItem The content item to process
 * @param contentType The content type containing the property schema
 * @returns The content item with resolved datasource properties
 */
const resolveDatasourceProperties = async (
  contentItem: ContentItem['value'],
  contentType: ContentType
): Promise<ContentItem['value']> => {
  if (!contentType?.value?.metadata?.propertySchema) {
    return contentItem;
  }

  const clonedContentItem = JSON.parse(JSON.stringify(contentItem));
  const properties = clonedContentItem.properties || {};
  const propertySchema = contentType.value.metadata.propertySchema;

  // Find properties with type "datasource"
  const datasourceProperties = Object.entries(propertySchema)
    .filter(([_, schema]) => (schema as PropertySchema).type === 'datasource')
    .map(([key]) => key);

  // No datasource properties to resolve
  if (datasourceProperties.length === 0) {
    return clonedContentItem;
  }

  // Process each datasource property
  for (const propertyKey of datasourceProperties) {
    const propertyValue = properties[propertyKey];
    if (!propertyValue) continue;

    try {
      // Get datasource info by key from schema
      const datasourceKey = (propertySchema[propertyKey] as PropertySchema)
        .datasourceType;
      if (!datasourceKey) continue;

      const resolvedDatasource = await resolveDatasource(
        datasourceKey,
        propertyValue.params
      );

      // Replace property value with resolved data
      if (resolvedDatasource) {
        clonedContentItem.properties[propertyKey] = resolvedDatasource;
      }
    } catch (error) {
      logger.error(
        `Failed to resolve datasource for property ${propertyKey}:`,
        error
      );
    }
  }

  return clonedContentItem;
};

export const getContentItems = async (
  businessUnitKey: string,
  criteria?: string
): Promise<ContentItem[]> => {
  const contentItemController = new CustomObjectController(
    CONTENT_ITEM_CONTAINER
  );
  let contentItemWhereClause = `value(businessUnitKey = "${businessUnitKey}")`;
  if (criteria) {
    contentItemWhereClause += ` AND ${criteria}`;
  }
  const contentItems = await contentItemController
    .getCustomObjects(contentItemWhereClause)
    .then((items) => {
      return items.map((item) => ({
        ...item,
        value: {
          ...item.value,
          id: item.id,
        },
      }));
    });

  const whereClause = contentItems
    ?.map(
      (item) =>
        `(key = "${item.key}" AND businessUnitKey = "${businessUnitKey}")`
    )
    .join(' OR ');
  const contentStates = whereClause
    ? await ContentStateController.getContentStatesWithWhereClause(whereClause)
    : [];
  const contentItemsWithStates = contentItems.map((item) => {
    const states = contentStates.find((state) => state.key === item.key);
    return {
      ...item,
      states: states?.states || {},
    };
  });

  return contentItemsWithStates;
};

export const getPreviewContentItem = async (
  businessUnitKey: string,
  key: string
): Promise<ContentItem['value']> => {
  const contentItemController = new CustomObjectController(
    CONTENT_ITEM_CONTAINER
  );
  const contentItem = await contentItemController.getCustomObject(key);
  const item = contentItem.value;
  const contentState = await getContentItemWithStateKey(businessUnitKey, key, [
    'draft',
    'published',
  ]);
  if (contentState) {
    return resolveContentItemDatasource(contentState);
  }

  // fallback to the original content item
  return resolveContentItemDatasource(item);
};

export const getPublishedContentItem = async (
  businessUnitKey: string,
  key: string
): Promise<ContentItem['value'] | undefined> => {
  return getContentItemWithStateKey(businessUnitKey, key, 'published');
};

export const getContentItemWithStateKey = async (
  businessUnitKey: string,
  key: string,
  state: string | string[]
): Promise<ContentItem['value'] | undefined> => {
  const contentState = await ContentStateController.getFirstContentWithState<
    ContentItem['value']
  >(`key = "${key}" AND businessUnitKey = "${businessUnitKey}"`, state);

  if (contentState) {
    return resolveContentItemDatasource(contentState);
  }

  return undefined;
};

export const queryContentItem = async (
  businessUnitKey: string,
  query: string,
  state: string | string[]
): Promise<ContentItem['value'] | undefined> => {
  const contentItemController = new CustomObjectController(
    CONTENT_ITEM_CONTAINER
  );

  const contentItems = await contentItemController.getCustomObjects(
    `value(${query} AND businessUnitKey = "${businessUnitKey}")`
  );

  if (contentItems.length === 0) {
    return undefined;
  }

  const contentState = await ContentStateController.getFirstContentWithState<
    ContentItem['value']
  >(
    `key = "${contentItems[0].key}" AND businessUnitKey = "${businessUnitKey}"`,
    state
  );

  if (contentState) {
    if (contentState) {
      return resolveContentItemDatasource(contentState);
    }
  }

  return undefined;
};

/**
 * Get a content item by key and resolve any datasource properties
 * @param key The content item key
 * @returns The content item with resolved datasource properties
 */
export const getContentItem = async (
  key: string
): Promise<ContentItem['value']> => {
  const contentItemController = new CustomObjectController(
    CONTENT_ITEM_CONTAINER
  );
  const contentItem = await contentItemController.getCustomObject(key);
  return contentItem.value;
};

export const createContentItem = async (
  businessUnitKey: string,
  item: ContentItem['value']
): Promise<ContentItem> => {
  const key = `item-${uuidv4()}`;
  const contentItemController = new CustomObjectController(
    CONTENT_ITEM_CONTAINER
  );

  const object = await contentItemController.createCustomObject(key, {
    ...item,
    businessUnitKey,
    key,
  });

  await ContentStateController.createDraftState(businessUnitKey, key, item);
  await ContentVersionController.createContentVersion(
    businessUnitKey,
    key,
    item
  );
  return object;
};

export const updateContentItem = async (
  businessUnitKey: string,
  key: string,
  item: ContentItem['value']
): Promise<ContentItem> => {
  const contentItemController = new CustomObjectController(
    CONTENT_ITEM_CONTAINER
  );

  const object = await contentItemController.updateCustomObject(key, {
    ...item,
    businessUnitKey,
  });
  await ContentStateController.createDraftState(businessUnitKey, key, item);
  await ContentVersionController.createContentVersion(
    businessUnitKey,
    key,
    item
  );
  return object;
};

export const deleteContentItem = async (
  businessUnitKey: string,
  key: string
): Promise<void> => {
  const contentItemController = new CustomObjectController(
    CONTENT_ITEM_CONTAINER
  );
  await contentItemController.deleteCustomObject(key);
  await ContentStateController.deleteStates(businessUnitKey, key);
  await ContentVersionController.deleteVersions(businessUnitKey, key);
};
