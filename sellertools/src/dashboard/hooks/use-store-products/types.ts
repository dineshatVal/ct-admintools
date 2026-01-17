import {
  ProductDraft,
  ProductPagedSearchResponse,
  ProductProjection,
  ProductTailoring,
  ProductTailoringInStoreDraft,
  ProductTailoringUpdateAction,
} from '@commercetools/platform-sdk';

export interface ProductSelectionResponse {
  productSelection?: {
    id: string;
    version: number;
    productRefs?: {
      results: Array<{
        product: {
          id: string;
          masterData: {
            current: {
              name: string;
              masterVariant: {
                images?: Array<{ url: string }>;
                sku?: string;
                key?: string;
              };
            };
          };
        };
      }>;
    };
  };
}

export interface ProductSearchResult {
  total: number;
  offset: number;
  limit: number;
  results: ProductData[];
}

// Product type definition
export interface ProductData {
  id: string;
  name: string;
  image: string;
  sku: string;
  isHighlighted?: boolean;
  isSelected?: boolean;
}

// Define the hook interface
export interface UseStoreProductsResult {
  executeProductSearchQuery: (params: {
    includeProductSelectionId: string;
    excludeProductSelectionId?: string;
    limit?: number;
    offset?: number;
    locale?: string;
    searchText?: string;
  }) => Promise<ProductPagedSearchResponse | null>;
  fetchUserStoreProducts: () => Promise<ProductSearchResult>;
  fetchMasterStoreProducts: () => Promise<ProductSearchResult>;
  addProductsToStore: (productIds: string[]) => Promise<boolean>;
  removeProductsFromStore: (productIds: string[]) => Promise<boolean>;
  createProduct: (productDraft: ProductDraft) => Promise<boolean>;
  searchStoreProducts: (searchText: string) => Promise<ProductSearchResult>;
  searchMasterProducts: (searchText: string) => Promise<ProductSearchResult>;
  getProductById: (productId: string) => Promise<ProductProjection>;
  getProductTailoringInStore: (
    productId: string
  ) => Promise<ProductTailoring | null>;
  createProductTailoring: (
    product: ProductTailoringInStoreDraft
  ) => Promise<ProductTailoring | null>;
  updateProductTailoring: (
    productId: string,
    updateActions: ProductTailoringUpdateAction[]
  ) => Promise<ProductTailoring | null>;
  loading: boolean;
  error: Error | null;
}

export interface CreateProductResponse {
  createProduct?: {
    id: string;
    version: number;
  };
}
