import { v4 as uuidv4 } from 'uuid';
import {
  CONTENT_PAGE_CONTAINER,
  MAX_VERSIONS,
  NUMBER_OF_COLUMNS,
  PAGE_CONTENT_ITEMS_CONTAINER,
  PAGE_STATE_CONTAINER,
  PAGE_VERSION_CONTAINER,
} from '../constants';
import { withDependencies as withContentStateDependencies } from './content-state-controller';
import { withDependencies as withContentVersionDependencies } from './content-version-controller';
import { CustomObjectController } from './custom-object.controller';
import * as PageContentItemController from './page-content-item.controller';
import type { ContentItem } from './content-item.controller';
import CustomError from '../errors/custom.error';
import { mapPageContentItems } from '../mappers/page';

export interface PageVersion {
  key: string;
  businessUnitKey: string;
  versions: Array<Page['value']>;
}

export interface PageState {
  key: string;
  businessUnitKey: string;
  states: Record<string, Page['value'] | undefined>;
}
export interface ContentItemReference {
  id: string;
  typeId: string;
  obj?: ContentItem;
}

export interface GridCell {
  id: string;
  contentItemKey: string | null;
  colSpan: number;
}

export interface GridRow {
  id: string;
  cells: GridCell[];
}

export interface Layout {
  rows: GridRow[];
}

export interface Page {
  id: string;
  version: number;
  container: string;
  key: string;
  value: {
    key: string;
    name: string;
    route: string;
    layout: Layout;
    components: ContentItemReference[];
  };
  [key: string]: any;
}

export interface ResolvedPage {
  id: string;
  version: number;
  container: string;
  key: string;
  value: {
    key: string;
    name: string;
    route: string;
    layout: Layout;
    components: ContentItem['value'][];
  };
  [key: string]: any;
}

const PageStateController = withContentStateDependencies<PageState>({
  CONTENT_CONTAINER: CONTENT_PAGE_CONTAINER,
  CONTENT_STATE_CONTAINER: PAGE_STATE_CONTAINER,
});

const PageVersionController = withContentVersionDependencies<PageVersion>({
  CONTENT_VERSION_CONTAINER: PAGE_VERSION_CONTAINER,
  MAX_VERSIONS: MAX_VERSIONS,
});

const createEmptyGridRow = (): GridRow => {
  const cells: GridCell[] = [];

  for (let i = 0; i < NUMBER_OF_COLUMNS; i++) {
    cells.push({
      id: uuidv4(),
      contentItemKey: null,
      colSpan: 1,
    });
  }

  return {
    id: uuidv4(),
    cells,
  };
};

const resolveContentItemsInPage = async (
  businessUnitKey: string,
  page: Page['value'] | ResolvedPage['value'],
  state: string | string[]
): Promise<ResolvedPage['value']> => {
  const allComponents = (await Promise.all(
    page.components.map(async (component) => {
      if (!component.obj) {
        return undefined;
      }
      const contentItem =
        await PageContentItemController.getContentItemWithStateKey(
          businessUnitKey,
          component.obj.key,
          state
        );
      return contentItem;
    })
  )) as ContentItem['value'][];
  return {
    ...page,
    components: allComponents.filter(Boolean),
  };
};

export const getPages = async (
  businessUnitKey: string,
  criteria?: string
): Promise<Page[]> => {
  const pageController = new CustomObjectController(CONTENT_PAGE_CONTAINER);
  let contentItemWhereClause = `value(businessUnitKey = "${businessUnitKey}")`;
  if (criteria) {
    contentItemWhereClause += ` AND ${criteria}`;
  }
  const contentItems = await pageController
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
  const pageStates = whereClause
    ? await PageStateController.getContentStatesWithWhereClause(whereClause)
    : [];
  const pageWithStates = contentItems.map((item) => {
    const states = pageStates.find((state) => state.key === item.key);
    return {
      ...item,
      states: states?.states || {},
    };
  });

  return pageWithStates;
};

export const getPublishedPage = async (
  businessUnitKey: string,
  key: string
): Promise<ResolvedPage['value'] | undefined> => {
  const pageState = await PageStateController.getFirstContentWithState<
    Page['value']
  >(`key = "${key}" AND businessUnitKey = "${businessUnitKey}"`, 'published', [
    'value.states.draft.components[*]',
    'value.states.published.components[*]',
  ]);
  if (pageState) {
    return resolveContentItemsInPage(businessUnitKey, pageState, 'published');
  }

  return undefined;
};

export const getPreviewPage = async (
  businessUnitKey: string,
  key: string
): Promise<ResolvedPage['value'] | undefined> => {
  const pageController = new CustomObjectController(CONTENT_PAGE_CONTAINER);
  const page = await pageController.getCustomObject(key);
  const item = page.value;
  const pageState = await PageStateController.getFirstContentWithState<
    Page['value']
  >(`key = "${key}" AND businessUnitKey = "${businessUnitKey}"`, ['draft', 'published'], [
    'value.states.draft.components[*]',
    'value.states.published.components[*]',
  ]);
  if (pageState) {
    return resolveContentItemsInPage(businessUnitKey, pageState, ['draft', 'published']);
  }

  return resolveContentItemsInPage(businessUnitKey, item, ['draft', 'published']);
};

export const getPageWithStates = async (
  businessUnitKey: string,
  key: string
): Promise<ResolvedPage['value']> => {
  const pageController = new CustomObjectController(CONTENT_PAGE_CONTAINER);
  const page = await pageController.getCustomObject(key, [
    'value.components[*]',
  ]);
  const item = page.value;
  const pageState = await PageStateController.getFirstContentWithState<
    Page['value']
  >(
    `key = "${key}" AND businessUnitKey = "${businessUnitKey}"`,
    ['draft', 'published'],
    ['value.states.draft.components[*]', 'value.states.published.components[*]']
  );
  if (pageState) {
    return mapPageContentItems({
      ...page,
      value: pageState,
    }).value;
  }

  return mapPageContentItems({
    ...page,
    value: item,
  }).value;
};
export const queryPage = async (
  businessUnitKey: string,
  query: string,
  state: string | string[]
): Promise<ResolvedPage['value'] | undefined> => {
  const pageController = new CustomObjectController(CONTENT_PAGE_CONTAINER);

  const pages = await pageController.getCustomObjects(
    `value(${query} AND businessUnitKey = "${businessUnitKey}")`
  );

  if (pages.length === 0) {
    return undefined;
  }

  const contentState = await PageStateController.getFirstContentWithState<
    Page['value']
  >(
    `key = "${pages[0].key}" AND businessUnitKey = "${businessUnitKey}"`,
    state,
    ['value.states.draft.components[*]',
    'value.states.published.components[*]',]
  );

  if (contentState) {
    if (contentState) {
      return resolveContentItemsInPage(businessUnitKey, contentState, state);
    }
  }

  return undefined;
};

/**
 * Get a page by key and resolve any datasource properties
 * @param key The content item key
 * @returns The page with resolved datasource properties
 */
export const getPage = async (key: string): Promise<ResolvedPage> => {
  const pageController = new CustomObjectController(CONTENT_PAGE_CONTAINER);
  const page = await pageController.getCustomObject(key, [
    'value.components[*]',
  ]);
  return mapPageContentItems(page);
};

export const createPage = async (
  businessUnitKey: string,
  item: Page['value']
): Promise<Page> => {
  const key = `page-${uuidv4()}`;
  const pageController = new CustomObjectController(CONTENT_PAGE_CONTAINER);

  const page = {
    ...item,
    businessUnitKey,
    key,
    layout: {
      rows: [createEmptyGridRow()],
    },
    components: [],
  };

  const object = await pageController.createCustomObject(key, page);

  await PageStateController.createDraftState(businessUnitKey, key, page);
  await PageVersionController.createContentVersion(businessUnitKey, key, page);
  return object;
};

export const updatePage = async (
  businessUnitKey: string,
  key: string,
  item: Page['value']
): Promise<ResolvedPage> => {
  const contentItemController = new CustomObjectController(
    CONTENT_PAGE_CONTAINER
  );
  const page = {
    ...item,
    businessUnitKey,
  };

  const object = await contentItemController.updateCustomObject(key, page, [
    'value.components[*]',
  ]);
  await PageStateController.createDraftState(businessUnitKey, key, page);
  await PageVersionController.createContentVersion(businessUnitKey, key, page);
  return mapPageContentItems(object);
};

export const deletePage = async (
  businessUnitKey: string,
  key: string
): Promise<void> => {
  const pageController = new CustomObjectController(CONTENT_PAGE_CONTAINER);

  const pageItemsController = new CustomObjectController(
    PAGE_CONTENT_ITEMS_CONTAINER
  );

  const page = await pageController.getCustomObject(key);

  try {
    await Promise.all(
      page.value.components
        .filter((component: any) => !!component)
        .map(async (component: ContentItemReference) => {
          return pageItemsController.deleteCustomObjectById(component.id);
        })
    );
  } catch (error) {
    console.warn('Error deleting content items', error);
  }
  await pageController.deleteCustomObject(key);
  await PageStateController.deleteStates(businessUnitKey, key);
  await PageVersionController.deleteVersions(businessUnitKey, key);
};

export const removeRowFromPage = async (
  businessUnitKey: string,
  pageKey: string,
  rowId: string
): Promise<ResolvedPage> => {
  const pageController = new CustomObjectController(CONTENT_PAGE_CONTAINER);
  const page = await pageController.getCustomObject(pageKey);
  const newLayout = JSON.parse(JSON.stringify(page.value.layout));
  const row = newLayout.rows.find((row: GridRow) => row.id === rowId);
  if (!row) {
    throw new CustomError(400, 'Row not found');
  }
  const contentItems = row.cells
    .map((cell: GridCell) => cell.contentItemKey)
    .filter((contentItemKey: string) => !!contentItemKey);

  const deletedContentItems = await Promise.all(
    contentItems.map((contentItemKey: string) =>
      PageContentItemController.deletePageContentItem(
        businessUnitKey,
        contentItemKey
      )
    )
  );

  newLayout.rows = newLayout.rows.filter((row: GridRow) => row.id !== rowId);
  const newComponents = page.value.components.filter(
    (component: ContentItemReference) =>
      !deletedContentItems.some(
        (deletedContentItem: ContentItemReference) =>
          deletedContentItem.id === component.id
      )
  );
  const newPage = {
    ...page,
    value: {
      ...page.value,
      layout: newLayout,
      components: newComponents,
    },
  };
  const updatedPage = await updatePage(businessUnitKey, pageKey, newPage.value);
  return updatedPage;
};

export const addRowToPage = async (
  businessUnitKey: string,
  pageKey: string
): Promise<ResolvedPage> => {
  const pageController = new CustomObjectController(CONTENT_PAGE_CONTAINER);
  const page = await pageController.getCustomObject(pageKey);
  const newLayout = JSON.parse(JSON.stringify(page.value.layout));
  newLayout.rows.push(createEmptyGridRow());
  const newPage = {
    ...page,
    value: { ...page.value, layout: newLayout },
  };
  const updatedPage = await updatePage(businessUnitKey, pageKey, newPage.value);
  return updatedPage;
};

export const updateCellSpanInPage = async (
  businessUnitKey: string,
  pageKey: string,
  rowId: string,
  cellId: string,
  updates: {
    colSpan: number;
    shouldRemoveEmptyCell?: boolean;
    shouldAddEmptyCell?: boolean;
  }
): Promise<ResolvedPage> => {
  const pageController = new CustomObjectController(CONTENT_PAGE_CONTAINER);
  const page = await pageController.getCustomObject(pageKey);
  const newLayout = JSON.parse(JSON.stringify(page.value.layout));

  const rowIndex = newLayout.rows.findIndex((row: any) => row.id === rowId);
  if (rowIndex !== -1) {
    const row = newLayout.rows[rowIndex];
    const cellIndex = row.cells.findIndex((cell: any) => cell.id === cellId);

    if (cellIndex !== -1) {
      // Get the old span to calculate the difference
      const oldSpan = row.cells[cellIndex].colSpan;
      const spanDifference = updates.colSpan - oldSpan;

      // Update the cell's span
      row.cells[cellIndex].colSpan = updates.colSpan;

      // If we're increasing the span and should remove empty cells
      if (spanDifference > 0 && updates.shouldRemoveEmptyCell) {
        // Find empty cells (cells with no component)
        const emptyCells = row.cells
          .map((cell: any, idx: any) => ({ cell, idx }))
          .filter(
            (item: any) => !item.cell.contentItemKey && item.idx !== cellIndex
          );

        // Remove empty cells with accumulated colSpan up to span difference
        if (emptyCells.length > 0) {
          const cellsToRemove: { cell: any; idx: number }[] = [];
          let accumulatedSpan = 0;

          // Accumulate cells until their colSpan sum reaches spanDifference
          for (const item of emptyCells) {
            const cellColSpan = item.cell.colSpan || 1;
            if (accumulatedSpan + cellColSpan <= spanDifference) {
              cellsToRemove.push(item);
              accumulatedSpan += cellColSpan;
            }

            // Stop when we've accumulated enough span
            if (accumulatedSpan >= spanDifference) {
              break;
            }
          }

          // Sort in reverse order to avoid index shifting when removing
          cellsToRemove.sort((a: any, b: any) => b.idx - a.idx);

          // Remove cells
          for (const { idx } of cellsToRemove) {
            row.cells.splice(idx, 1);
          }
        }
      }

      // If we're decreasing the span and should add empty cells
      if (spanDifference < 0 && updates.shouldAddEmptyCell) {
        // Create new empty cells
        const newCells = Array(-spanDifference)
          .fill(0)
          .map(() => ({
            id: uuidv4(),
            contentItemKey: null,
            colSpan: 1,
          }));

        // Add them after the current cell
        row.cells.splice(cellIndex + 1, 0, ...newCells);
      }
    }
  }
  const newPage = {
    ...page,
    value: { ...page.value, layout: newLayout },
  };
  const updatedPage = await updatePage(businessUnitKey, pageKey, newPage.value);
  return updatedPage;
};

export const addContentItemToPage = async (
  businessUnitKey: string,
  pageKey: string,
  contentItemKey: string,
  rowId: string,
  cellId: string
): Promise<ResolvedPage> => {
  const pageController = new CustomObjectController(CONTENT_PAGE_CONTAINER);

  const page = await pageController.getCustomObject(pageKey);

  const newLayout = JSON.parse(JSON.stringify(page.value.layout));
  const row = newLayout.rows.find((row: GridRow) => row.id === rowId);
  if (!row) {
    throw new CustomError(400, 'Row not found');
  }
  const cell = row.cells.find((cell: GridCell) => cell.id === cellId);
  if (!cell) {
    throw new CustomError(400, 'Cell not found');
  }

  const key = `page-item-${uuidv4()}`;

  const item = {
    type: contentItemKey,
    key,
    name: 'New Component',
    businessUnitKey,
    properties: {},
  };

  const contentItem = await PageContentItemController.createPageContentItem(
    businessUnitKey,
    item
  );

  cell.contentItemKey = contentItem.key;

  const newPage = {
    ...page,
    value: {
      ...page.value,
      components: [
        ...page.value.components,
        { id: contentItem.id, typeId: 'key-value-document' },
      ] as ContentItemReference[],
      layout: newLayout,
    },
  };

  const updatedPage = await updatePage(businessUnitKey, pageKey, newPage.value);

  return updatedPage;
};

export const updateComponentInPage = async (
  businessUnitKey: string,
  pageKey: string,
  contentItemKey: string,
  updates: Partial<ContentItem['value']>
): Promise<ResolvedPage> => {
  const pageController = new CustomObjectController(CONTENT_PAGE_CONTAINER);
  const page = await pageController.getCustomObject(pageKey, [
    'value.components[*]',
  ]);

  if (
    !page.value.components.some(
      (component: ContentItemReference) => component.obj?.key === contentItemKey
    )
  ) {
    throw new CustomError(400, 'Component not found');
  }

  await PageContentItemController.updatePageContentItem(
    businessUnitKey,
    contentItemKey,
    updates
  );
  const newPage = await pageController.getCustomObject(pageKey, [
    'value.components[*]',
  ]);
  return mapPageContentItems(newPage);
};

export const removeComponentFromPage = async (
  businessUnitKey: string,
  pageKey: string,
  contentItemKey: string
): Promise<ResolvedPage> => {
  const pageController = new CustomObjectController(CONTENT_PAGE_CONTAINER);
  const page = await pageController.getCustomObject(pageKey, [
    'value.components[*]',
  ]);
  const newLayout = JSON.parse(JSON.stringify(page.value.layout));

  if (
    !page.value.components.some(
      (component: ContentItemReference) => component.obj?.key === contentItemKey
    )
  ) {
    throw new CustomError(400, 'Component not found');
  }

  const rowIndex = newLayout.rows.findIndex((row: GridRow) =>
    row.cells.some((cell: GridCell) => cell.contentItemKey === contentItemKey)
  );
  if (rowIndex === -1) {
    throw new CustomError(400, 'Component not found in row');
  }
  const row = newLayout.rows[rowIndex];
  const cellIndex = row.cells.findIndex(
    (cell: GridCell) => cell.contentItemKey === contentItemKey
  );
  if (cellIndex === -1) {
    throw new CustomError(400, 'Component not found in cell');
  }
  row.cells[cellIndex].contentItemKey = null;

  const deletedPageItem = await PageContentItemController.deletePageContentItem(
    businessUnitKey,
    contentItemKey
  );

  const newComponents = page.value.components.filter(
    (component: ContentItemReference) => component.id !== deletedPageItem.id
  );
  const newPage = {
    ...page,
    value: { ...page.value, components: newComponents, layout: newLayout },
  };
  const updatedPage = await updatePage(businessUnitKey, pageKey, newPage.value);
  return updatedPage;
};
