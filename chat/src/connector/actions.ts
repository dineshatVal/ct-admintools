import { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk/dist/declarations/src/generated/client/by-project-key-request-builder';

export const SHARED_CONTAINER = 'shared-sellertools-container';
export const AI_ASSISTANT_DEPLOYED_URL_KEY = 'chat-app-deployed-url';

export async function createCustomObject(
  apiRoot: ByProjectKeyRequestBuilder,
  applicationUrl: string
): Promise<void> {
  await apiRoot
    .customObjects()
    .post({
      body: {
        key: AI_ASSISTANT_DEPLOYED_URL_KEY,
        container: SHARED_CONTAINER,
        value: applicationUrl,
      },
    })
    .execute();
}
