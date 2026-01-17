import { ProductData } from './types';

// Cache keys and utilities
export const PRODUCTS_FROM_MASTER_TO_STORE_KEY = 'productsFromMasterToStore';
export const PRODUCTS_FROM_STORE_TO_MASTER_KEY = 'productsFromStoreToMaster';

// Inline cache utilities
export const getCacheData = (cacheKey: string) => {
  try {
    const cached = localStorage.getItem(cacheKey);
    return cached ? JSON.parse(cached) : {};
  } catch (error) {
    console.warn(`Failed to parse cache for key ${cacheKey}:`, error);
    return {};
  }
};

export const setCacheData = (cacheKey: string, data: any) => {
  try {
    localStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (error) {
    console.warn(`Failed to set cache for key ${cacheKey}:`, error);
  }
};

export const getProductsFromCache = (
  cacheKey: string,
  productSelectionId: string
): ProductData[] => {
  const cache = getCacheData(cacheKey);
  return cache[productSelectionId] || [];
};

export const addProductsToCache = (
  cacheKey: string,
  productSelectionId: string,
  products: ProductData[]
) => {
  const cache = getCacheData(cacheKey);
  if (!cache[productSelectionId]) {
    cache[productSelectionId] = [];
  }

  products.forEach((product) => {
    const exists = cache[productSelectionId].some(
      (p: ProductData) => p.id === product.id
    );
    if (!exists) {
      cache[productSelectionId].push(product);
    }
  });

  setCacheData(cacheKey, cache);
};

export const removeProductsFromCache = (
  cacheKey: string,
  productSelectionId: string,
  productIds: string[]
) => {
  const cache = getCacheData(cacheKey);
  if (cache[productSelectionId]) {
    cache[productSelectionId] = cache[productSelectionId].filter(
      (product: ProductData) => !productIds.includes(product.id)
    );

    if (cache[productSelectionId].length === 0) {
      delete cache[productSelectionId];
    }
  }
  setCacheData(cacheKey, cache);
};

const mergeCachedWithResults = (
  actualResults: ProductData[],
  cachedProducts: ProductData[],
  cacheKey: string,
  productSelectionId: string
): ProductData[] => {
  const actualProductIds = new Set(actualResults.map((p) => p.id));
  const productsToRemoveFromCache: string[] = [];

  // Find cached products that already exist in actual results
  const uniqueCachedProducts = cachedProducts
    .filter((cachedProduct) => {
      if (actualProductIds.has(cachedProduct.id)) {
        productsToRemoveFromCache.push(cachedProduct.id);
        return false; // Don't include in final results
      }
      return true; // Include products that don't exist in actual results
    })
    .map((product) => ({
      ...product,
      isHighlighted: true,
    }));

  // Remove duplicates from cache
  if (productsToRemoveFromCache.length > 0) {
    removeProductsFromCache(
      cacheKey,
      productSelectionId,
      productsToRemoveFromCache
    );
  }

  // Merge actual results with unique cached products
  return [...actualResults, ...uniqueCachedProducts];
};

const removeCachedFromResults = (
  results: ProductData[],
  cachedProducts: ProductData[]
): ProductData[] => {
  const cachedProductIds = new Set(cachedProducts.map((p) => p.id));

  // Filter out products that exist in the cache
  return results.filter((product) => !cachedProductIds.has(product.id));
};

export const mergeCacheWithResults = (
  results: ProductData[],
  currentListChacheKey: string,
  otherListCacheKey: string,
  currentListProductSelectionId: string,
  otherListProductSelectionId: string
): ProductData[] => {
  const cachedProductsComming = getProductsFromCache(
    otherListCacheKey,
    currentListProductSelectionId
  );
  console.log(
    'cachedProductsComming ' +
      currentListProductSelectionId +
      '  ' +
      otherListCacheKey,
    cachedProductsComming
  );
  const cachedProductsGoing = getProductsFromCache(
    currentListChacheKey,
    otherListProductSelectionId
  );
  let mergedResults = [...results];
  if (cachedProductsComming.length > 0) {
    mergedResults = mergeCachedWithResults(
      mergedResults,
      cachedProductsComming,
      otherListCacheKey,
      currentListProductSelectionId
    );
  }
  if (cachedProductsGoing.length > 0) {
    mergedResults = removeCachedFromResults(mergedResults, cachedProductsGoing);
  }
  return mergedResults;
};
