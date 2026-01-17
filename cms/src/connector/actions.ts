import { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk/dist/declarations/src/generated/client/by-project-key-request-builder';
import { logger } from '../utils/logger.utils';
import sampleDatasources from '../samples/datasource';
import sampleContentTypes from '../samples/content-types';
import { CMS_DEPLOYED_URL_KEY, CONTENT_TYPE_CONTAINER, DATASOURCE_CONTAINER, SHARED_CONTAINER } from '../constants';

export async function createServiceURLStorageLink(
  apiRoot: ByProjectKeyRequestBuilder,
  applicationUrl: string
): Promise<void> {
  await apiRoot
    .customObjects()
    .post({
      body: {
        key: CMS_DEPLOYED_URL_KEY,
        container: SHARED_CONTAINER,
        value: applicationUrl,
      },
    })
    .execute();
}

export async function createDefaultDatasources(
  apiRoot: ByProjectKeyRequestBuilder
): Promise<void> {
  logger.info('Creating default datasources...');
  try {
    await Promise.all(
      sampleDatasources.map(async (datasource) => {
        return apiRoot
          .customObjects()
          .post({
            body: {
              key: datasource.key,
              container: DATASOURCE_CONTAINER,
              value: datasource.value,
            },
          })
          .execute();
      })
    );
    logger.info('Default datasources created successfully');
  } catch (error) {
    logger.error('Failed to create default datasources:', error);
  }
}

export async function createDefaultContentTypes(
  apiRoot: ByProjectKeyRequestBuilder
): Promise<void> {
  logger.info('Creating default content types...');
  try {
    await Promise.all(
      sampleContentTypes.map(async (contentType) => {
        return apiRoot.customObjects().post({
          body: {
            key: contentType.key,
            container: CONTENT_TYPE_CONTAINER,
            value: contentType.value,
          },
        });
      })
    );
    logger.info('Default content types created successfully');
  } catch (error) {
    logger.error('Failed to create default content types:', error);
  }
}