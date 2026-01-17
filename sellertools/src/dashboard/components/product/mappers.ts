import { ProductProjection } from '@commercetools/platform-sdk';
import { ProductFormData } from './details';
import { TCurrencyCode } from '@commercetools-uikit/money-input';

export const mapProductTailoringToProductFormData = (
  product: ProductProjection,
  locale?: string
): ProductFormData => {
  return {
    productType: {
      id: product.productType?.id ?? '',
      typeId: 'product-type',
    },
    name: product.name?.[locale || 'en-US'] ?? '',
    description: product.description?.[locale || 'en-US'] ?? '',
    sku: product.masterVariant?.sku ?? '',
    price: {
      currencyCode: (product.masterVariant?.prices?.[0]?.value?.currencyCode ??
        'USD') as TCurrencyCode,
      amount: (
        (product.masterVariant?.prices?.[0]?.value?.centAmount ?? 0) /
        Math.pow(
          10,
          product.masterVariant?.prices?.[0]?.value?.fractionDigits ?? 2
        )
      ).toString(),
    },
    imageUrl: product.masterVariant?.images?.[0]?.url ?? '',
    imageLabel: product.masterVariant?.images?.[0]?.label ?? '',
  };
};
