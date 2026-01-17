import { createApiRoot } from '../client/create.client';
import CustomError from '../errors/custom.error';

interface CommercetoolsError {
  statusCode: number;
  message: string;
}

export class CustomObjectController {
  private container: string;

  constructor(container: string) {
    this.container = container;
  }

  /**
   * Create a custom object
   * @param container The container name
   * @param key The custom object key
   * @param value The custom object value
   * @returns The created custom object
   */
  createCustomObject = async (key: string, value: any) => {
    try {
      const apiRoot = createApiRoot();
      const response = await apiRoot
        .customObjects()
        .post({
          body: {
            container: this.container,
            key,
            value,
          },
        })
        .execute();

      return response.body;
    } catch (error) {
      const apiError = error as CommercetoolsError;
      throw new CustomError(
        apiError.statusCode || 500,
        `Failed to create custom object: ${apiError.message}`
      );
    }
  };

  /**
   * Get a custom object by container and key
   * @param container The container name
   * @param key The custom object key
   * @returns The custom object if found
   */
  getCustomObject = async (key: string, expand?: string[]) => {
    try {
      const apiRoot = createApiRoot();
      const response = await apiRoot
        .customObjects()
        .withContainerAndKey({ container: this.container, key })
        .get({
          queryArgs: {
            ...(expand ? { expand } : {}),
          },
        })
        .execute();

      return response.body;
    } catch (error) {
      const apiError = error as CommercetoolsError;
      if (apiError.statusCode === 404) {
        throw new CustomError(404, `Custom object not found with key: ${key}`);
      }
      throw new CustomError(
        apiError.statusCode || 500,
        `Failed to get custom object: ${apiError.message}`
      );
    }
  };

  /**
   * Update a custom object
   * @param container The container name
   * @param key The custom object key
   * @param value The new value
   * @returns The updated custom object
   */
  updateCustomObject = async (key: string, value: any, expand?: string[]) => {
    try {
      const apiRoot = createApiRoot();
      const response = await apiRoot
        .customObjects()
        .post({
          body: {
            container: this.container,
            key,
            value,
          },
          queryArgs: {
            ...(expand ? { expand } : {}),
          },
        })
        .execute();

      return response.body;
    } catch (error) {
      const apiError = error as CommercetoolsError;
      throw new CustomError(
        apiError.statusCode || 500,
        `Failed to update custom object: ${apiError.message}`
      );
    }
  };

  /**
   * Delete a custom object
   * @param container The container name
   * @param key The custom object key
   */
  deleteCustomObject = async (key: string) => {
    try {
      const apiRoot = createApiRoot();
      return apiRoot
        .customObjects()
        .withContainerAndKey({ container: this.container, key })
        .delete()
        .execute();
    } catch (error) {
      const apiError = error as CommercetoolsError;
      if (apiError.statusCode === 404) {
        throw new CustomError(404, `Custom object not found with key: ${key}`);
      }
      throw new CustomError(
        apiError.statusCode || 500,
        `Failed to delete custom object: ${apiError.message}`
      );
    }
  };

  /**
   * Delete a custom object
   * @param container The container name
   * @param key The custom object key
   */
  deleteCustomObjectById = async (id: string) => {
    try {
      const apiRoot = createApiRoot();
      const response = await apiRoot
        .customObjects()
        .withContainer({ container: this.container })
        .get({
          queryArgs: {
            where: `id="${id}"`,
          },
        })
        .execute();
      await apiRoot
        .customObjects()
        .withContainerAndKey({
          container: this.container,
          key: response.body.results[0].key,
        })
        .delete()
        .execute();
    } catch (error) {
      const apiError = error as CommercetoolsError;
      if (apiError.statusCode === 404) {
        throw new CustomError(404, `Custom object not found with id: ${id}`);
      }
      throw new CustomError(
        apiError.statusCode || 500,
        `Failed to delete custom object: ${apiError.message}`
      );
    }
  };

  /**
   * Get all custom objects in a container
   * @param container The container name
   * @returns Array of custom objects
   */
  getCustomObjects = async (query?: string, expand?: string[]) => {
    const whereClause = [];
    if (query) {
      whereClause.push(query);
    }
    const whereClauseString = whereClause.join(' and ');
    try {
      const apiRoot = createApiRoot();
      const response = await apiRoot
        .customObjects()
        .withContainer({ container: this.container })
        .get({
          queryArgs: {
            ...(whereClauseString ? { where: whereClauseString } : {}),
            ...(expand ? { expand } : {}),
          },
        })
        .execute();

      return response.body.results;
    } catch (error) {
      const apiError = error as CommercetoolsError;
      throw new CustomError(
        apiError.statusCode || 500,
        `Failed to get custom objects: ${apiError.message}`
      );
    }
  };
}
