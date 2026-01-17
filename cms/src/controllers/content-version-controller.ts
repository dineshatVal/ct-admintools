import { v4 as uuidv4 } from 'uuid';
import { CustomObjectController } from './custom-object.controller';
import CustomError from '../errors/custom.error';

interface GenericContentItemVersion {
  key: string;
  businessUnitKey: string;
  versions: Array<any>;
}

export interface ContentVersionControllerDependencies {
  CONTENT_VERSION_CONTAINER: string;
  MAX_VERSIONS: number;
}

// Internal function that accepts dependencies
const _getContentVersions = async <T extends GenericContentItemVersion>(
  dependencies: ContentVersionControllerDependencies,
  businessUnitKey: string,
  key: string
): Promise<T> => {
  const contentVersionController = new CustomObjectController(
    dependencies.CONTENT_VERSION_CONTAINER
  );
  try {
    const versionKey = `${businessUnitKey}_${key}`;

    const contentVersions =
      await contentVersionController.getCustomObject(versionKey);
    return contentVersions.value;
  } catch (error) {
    if ((error as any).statusCode === 404) {
      return {
        key,
        businessUnitKey,
        versions: [] as Array<any>,
      } as T;
    } else {
      throw new CustomError(500, 'Failed to get versions');
    }
  }
};

// Internal function that accepts dependencies
// TODO: Remove
const _getContentVersion = async <T extends GenericContentItemVersion>(
  dependencies: ContentVersionControllerDependencies,
  businessUnitKey: string,
  key: string,
  versionId: string
): Promise<T> => {
  const versions = await _getContentVersions<T>(
    dependencies,
    businessUnitKey,
    key
  );
  return versions.versions.find((version) => version.id === versionId);
};

// Internal function that accepts dependencies
const _createContentVersion = async <T extends GenericContentItemVersion>(
  dependencies: ContentVersionControllerDependencies,
  businessUnitKey: string,
  key: string,
  value: any
): Promise<T> => {
  const versionKey = `${businessUnitKey}_${key}`;
  const existingVersions = await _getContentVersions(
    dependencies,
    businessUnitKey,
    key
  );

  const newVersion = {
    ...value,
    timestamp: new Date().toISOString(),
    id: uuidv4(),
  };

  existingVersions.versions.unshift(newVersion);

  const contentVersionController = new CustomObjectController(
    dependencies.CONTENT_VERSION_CONTAINER
  );

  if (existingVersions.versions.length > dependencies.MAX_VERSIONS) {
    existingVersions.versions = existingVersions.versions.slice(
      0,
      dependencies.MAX_VERSIONS
    );
  }
  const contentVersion = await contentVersionController.updateCustomObject(
    versionKey,
    existingVersions
  );
  return contentVersion.value;
};

// Internal function that accepts dependencies
const _deleteVersions = async (
  dependencies: ContentVersionControllerDependencies,
  businessUnitKey: string,
  key: string
): Promise<void> => {
  const versionKey = `${businessUnitKey}_${key}`;
  const contentVersionController = new CustomObjectController(
    dependencies.CONTENT_VERSION_CONTAINER
  );
  await contentVersionController.deleteCustomObject(versionKey);
};

// Higher-order function that injects dependencies
export const withDependencies = <T extends GenericContentItemVersion>(
  dependencies: ContentVersionControllerDependencies
) => ({
  getContentVersions: (businessUnitKey: string, key: string) =>
    _getContentVersions<T>(dependencies, businessUnitKey, key),

  getContentVersion: (
    businessUnitKey: string,
    key: string,
    versionId: string
  ) => _getContentVersion<T>(dependencies, businessUnitKey, key, versionId),

  createContentVersion: (businessUnitKey: string, key: string, value: any) =>
    _createContentVersion<T>(dependencies, businessUnitKey, key, value),

  deleteVersions: (businessUnitKey: string, key: string) =>
    _deleteVersions(dependencies, businessUnitKey, key),
});
