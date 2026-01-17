import { CustomObjectController } from './custom-object.controller';
import CustomError from '../errors/custom.error';

interface GenericState {
  key: string;
  businessUnitKey: string;
  states: Record<string, any>;
}

export interface StateControllerDependencies {
  CONTENT_CONTAINER: string;
  CONTENT_STATE_CONTAINER: string;
}

// Internal function that accepts dependencies
const _getContentStatesWithWhereClause = async <T>(
  dependencies: StateControllerDependencies,
  whereClause: string,
  expand?: string[]
): Promise<T[]> => {
  const contentStateController = new CustomObjectController(
    dependencies.CONTENT_STATE_CONTAINER
  );
  const contentStates = await contentStateController.getCustomObjects(
    `value(${whereClause})`,
    expand
  );
  return contentStates.map((state) => state.value);
};

const _getFirstContentWithState = async <T extends GenericState, R>(
  dependencies: StateControllerDependencies,
  whereClause: string,
  stateKey: string | string[],
  expand?: string[]
): Promise<R | undefined> => {
  const contentStates = await _getContentStatesWithWhereClause<T>(
    dependencies,
    whereClause,
    expand
  );
  if (contentStates.length > 0) {
    if (Array.isArray(stateKey)) {
      for (const state of stateKey) {
        if (contentStates[0].states[state]) {
          return contentStates[0].states[state];
        }
      }
    } else {
      if (contentStates[0].states[stateKey]) {
        return contentStates[0].states[stateKey];
      }
    }
  }
  return undefined;
};

// Internal function that accepts dependencies
const _getState = async <T>(
  dependencies: StateControllerDependencies,
  key: string
): Promise<T> => {
  const contentStateController = new CustomObjectController(
    dependencies.CONTENT_STATE_CONTAINER
  );
  const contentState = await contentStateController.getCustomObject(key);
  return contentState.value;
};

// Internal function that accepts dependencies
const _createDraftState = async <T extends GenericState>(
  dependencies: StateControllerDependencies,
  businessUnitKey: string,
  key: string,
  value: any
): Promise<T> => {
  const stateKey = `${businessUnitKey}_${key}`;
  let existingState: T;
  try {
    existingState = await _getState(dependencies, stateKey);
  } catch (error) {
    if ((error as any).statusCode === 404) {
      existingState = {
        key,
        businessUnitKey,
        states: {},
      } as T;
    } else {
      throw new CustomError(500, 'Failed to create draft state');
    }
  }
  existingState.states = {
    ...existingState.states,
    draft: value,
  };

  const contentStateController = new CustomObjectController(
    dependencies.CONTENT_STATE_CONTAINER
  );
  const contentState = await contentStateController.updateCustomObject(
    stateKey,
    existingState
  );
  return contentState.value;
};

// Internal function that accepts dependencies
const _createPublishedState = async <T extends GenericState>(
  dependencies: StateControllerDependencies,
  businessUnitKey: string,
  key: string,
  value: any,
  clear?: boolean
): Promise<T> => {
  const stateKey = `${businessUnitKey}_${key}`;
  let existingState: T;
  try {
    existingState = await _getState(dependencies, stateKey);
  } catch (error) {
    if ((error as any).statusCode === 404) {
      existingState = {
        key,
        businessUnitKey,
        states: {},
      } as T;
    } else {
      throw new CustomError(500, 'Failed to create published state');
    }
  }
  existingState.states = {
    ...existingState.states,
    published: value,
  };
  if (clear) {
    existingState.states = {
      ...existingState.states,
      draft: undefined,
    };
  }

  const contentStateController = new CustomObjectController(
    dependencies.CONTENT_STATE_CONTAINER
  );
  const contentState = await contentStateController.updateCustomObject(
    stateKey,
    existingState
  );
  return contentState.value;
};

// Internal function that accepts dependencies
const _deleteDraftState = async <T extends GenericState>(
  dependencies: StateControllerDependencies,
  businessUnitKey: string,
  key: string
): Promise<T> => {
  const stateKey = `${businessUnitKey}_${key}`;
  let existingState: T;
  try {
    existingState = await _getState(dependencies, stateKey);
  } catch (error) {
    if ((error as any).statusCode === 404) {
      existingState = {
        key,
        businessUnitKey,
        states: {},
      } as T;
    } else {
      throw new CustomError(500, 'Failed to delete draft state');
    }
  }

  if (!existingState.states.published) {
    throw new CustomError(404, 'No published state found');
  }

  existingState.states = {
    ...existingState.states,
    draft: undefined,
  };

  const contentItemController = new CustomObjectController(
    dependencies.CONTENT_CONTAINER
  );

  const contentStateController = new CustomObjectController(
    dependencies.CONTENT_STATE_CONTAINER
  );
  await contentItemController.updateCustomObject(key, {
    ...existingState.states.published,
    businessUnitKey,
  });

  const contentState = await contentStateController.updateCustomObject(
    stateKey,
    existingState
  );
  return contentState.value;
};

// Internal function that accepts dependencies
const _deleteStates = async (
  dependencies: StateControllerDependencies,
  businessUnitKey: string,
  key: string
): Promise<void> => {
  const stateKey = `${businessUnitKey}_${key}`;
  const contentStateController = new CustomObjectController(
    dependencies.CONTENT_STATE_CONTAINER
  );
  await contentStateController.deleteCustomObject(stateKey);
};

// Higher-order function that injects dependencies
export const withDependencies = <T extends GenericState>(
  dependencies: StateControllerDependencies
) => ({
  getContentStatesWithWhereClause: (whereClause: string, expand?: string[]) =>
    _getContentStatesWithWhereClause<T>(dependencies, whereClause, expand),

  getFirstContentWithState: <R>(
    whereClause: string,
    stateKey: string | string[],
    expand?: string[]
  ) =>
    _getFirstContentWithState<T, R>(
      dependencies,
      whereClause,
      stateKey,
      expand
    ),

  getState: (key: string) => _getState<T>(dependencies, key),

  createDraftState: (businessUnitKey: string, key: string, value: any) =>
    _createDraftState<T>(dependencies, businessUnitKey, key, value),

  createPublishedState: (
    businessUnitKey: string,
    key: string,
    value: any,
    clear?: boolean
  ) =>
    _createPublishedState<T>(dependencies, businessUnitKey, key, value, clear),

  deleteDraftState: (businessUnitKey: string, key: string) =>
    _deleteDraftState<T>(dependencies, businessUnitKey, key),

  deleteStates: (businessUnitKey: string, key: string) =>
    _deleteStates(dependencies, businessUnitKey, key),
});
