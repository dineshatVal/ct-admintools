import {
  ProductProjection,
  ProductSearchResult,
} from '@commercetools/platform-sdk';

export const mapProductSearchResponse = (
  product: ProductSearchResult,
  index: number,
  locale: string
): {
  id: string;
  name: string;
  image: string;
  sku: string;
} => {
  // Get the image URL with better fallbacks
  let imageUrl = 'https://via.placeholder.com/80';
  const masterVariant = product.productProjection?.masterVariant;

  if (masterVariant?.images && masterVariant.images.length > 0) {
    imageUrl = masterVariant.images[0].url;
  }

  // Add cache busting parameter to prevent browser caching issues
  if (imageUrl && !imageUrl.includes('via.placeholder.com')) {
    // Add a unique timestamp and random parameter to prevent caching
    const cacheBuster = `_cb=${Date.now()}_${index}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;
    imageUrl = imageUrl.includes('?')
      ? `${imageUrl}&${cacheBuster}`
      : `${imageUrl}?${cacheBuster}`;
  }

  // Get the best SKU with fallbacks
  const sku = masterVariant?.sku || masterVariant?.key || 'No SKU';

  return {
    id: product.id,
    name: product.productProjection?.name[locale] || 'Unnamed product',
    image: imageUrl,
    sku,
  };
};

export const mapProdutProjectionResponse = (
  product: ProductProjection,
  index: number,
  locale: string
): {
  id: string;
  name: string;
  image: string;
  sku: string;
} => {
  // Get the image URL with better fallbacks
  let imageUrl = 'https://via.placeholder.com/80';
  const masterVariant = product.masterVariant;

  if (masterVariant?.images && masterVariant.images.length > 0) {
    imageUrl = masterVariant.images[0].url;
  }

  // Add cache busting parameter to prevent browser caching issues
  if (imageUrl && !imageUrl.includes('via.placeholder.com')) {
    // Add a unique timestamp and random parameter to prevent caching
    const cacheBuster = `_cb=${Date.now()}_${index}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;
    imageUrl = imageUrl.includes('?')
      ? `${imageUrl}&${cacheBuster}`
      : `${imageUrl}?${cacheBuster}`;
  }

  // Get the best SKU with fallbacks
  const sku = masterVariant?.sku || masterVariant?.key || 'No SKU';

  return {
    id: product.id,
    name: product.name[locale] || 'Unnamed product',
    image: imageUrl,
    sku,
  };
};
