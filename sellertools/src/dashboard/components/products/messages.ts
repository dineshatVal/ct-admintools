import { defineMessages } from 'react-intl';

export default defineMessages({
  title: {
    id: 'Products.title',
    defaultMessage: 'Products',
  },
  backButton: {
    id: 'Products.backButton',
    defaultMessage: 'Back to Dashboard',
  },
  refreshButton: {
    id: 'Products.refreshButton',
    defaultMessage: 'Refresh',
  },
  addProduct: {
    id: 'Products.addProduct',
    defaultMessage: 'Add Product',
  },
  masterProductsTitle: {
    id: 'Products.masterProductsTitle',
    defaultMessage: 'Master Store Products',
  },
  masterProductsDescription: {
    id: 'Products.masterProductsDescription',
    defaultMessage: 'Select products to add to your store',
  },
  masterProductsCount: {
    id: 'Products.masterProductsCount',
    defaultMessage: 'Showing {count} products from master catalog',
  },
  storeProductsTitle: {
    id: 'Products.storeProductsTitle',
    defaultMessage: 'Your Store Products',
  },
  storeProductsDescription: {
    id: 'Products.storeProductsDescription',
    defaultMessage:
      "Products currently in your store's catalog. Select to remove products",
  },
  storeProductsCount: {
    id: 'Products.storeProductsCount',
    defaultMessage: 'Showing {count} products from your store',
  },
  selectedProducts: {
    id: 'Products.selectedProducts',
    defaultMessage: '{count} product{plural} selected',
  },
  addToStore: {
    id: 'Products.addToStore',
    defaultMessage: 'Add to Store',
  },
  adding: {
    id: 'Products.adding',
    defaultMessage: 'Adding...',
  },
  removeFromStore: {
    id: 'Products.removeFromStore',
    defaultMessage: 'Remove from Store',
  },
  removing: {
    id: 'Products.removing',
    defaultMessage: 'Removing...',
  },
  loadingMasterProducts: {
    id: 'Products.loadingMasterProducts',
    defaultMessage: 'Loading master products...',
  },
  loadingStoreProducts: {
    id: 'Products.loadingStoreProducts',
    defaultMessage: 'Loading store products...',
  },
  errorMasterProducts: {
    id: 'Products.errorMasterProducts',
    defaultMessage: 'Error loading master products: {error}',
  },
  errorStoreProducts: {
    id: 'Products.errorStoreProducts',
    defaultMessage: 'Error loading store products: {error}',
  },
  noMasterProducts: {
    id: 'Products.noMasterProducts',
    defaultMessage: 'No master products found',
  },
  noMasterProductsDesc: {
    id: 'Products.noMasterProductsDesc',
    defaultMessage: 'There are no products in the master catalog.',
  },
  noStoreProducts: {
    id: 'Products.noStoreProducts',
    defaultMessage: 'No store products',
  },
  noStoreProductsDesc: {
    id: 'Products.noStoreProductsDesc',
    defaultMessage: 'Select products from the master catalog to add them here.',
  },
  // Product Form Messages
  createProduct: {
    id: 'Products.createProduct',
    defaultMessage: 'Create New Product',
  },
  productBasicInfo: {
    id: 'Products.productBasicInfo',
    defaultMessage: 'Basic Information',
  },
  productName: {
    id: 'Products.productName',
    defaultMessage: 'Product Name',
  },
  productDescription: {
    id: 'Products.productDescription',
    defaultMessage: 'Description',
  },
  masterVariant: {
    id: 'Products.masterVariant',
    defaultMessage: 'Master Variant Details',
  },
  variantSku: {
    id: 'Products.variantSku',
    defaultMessage: 'SKU',
  },
  price: {
    id: 'Products.price',
    defaultMessage: 'Price (USD)',
  },
  priceHint: {
    id: 'Products.priceHint',
    defaultMessage: 'Enter the price in US dollars',
  },
  productImage: {
    id: 'Products.productImage',
    defaultMessage: 'Product Image',
  },
  imageUrl: {
    id: 'Products.imageUrl',
    defaultMessage: 'Image URL',
  },
  imageLabel: {
    id: 'Products.imageLabel',
    defaultMessage: 'Image Label',
  },
  imagePreview: {
    id: 'Products.imagePreview',
    defaultMessage: 'Preview:',
  },
  cancel: {
    id: 'Products.cancel',
    defaultMessage: 'Cancel',
  },
  createProductButton: {
    id: 'Products.createProductButton',
    defaultMessage: 'Create Product',
  },
  updateProductButton: {
    id: 'Products.updateProductButton',
    defaultMessage: 'Update Product',
  },
  productCreateSuccess: {
    id: 'Products.productCreateSuccess',
    defaultMessage: 'Product created successfully!',
  },
  productCreateError: {
    id: 'Products.productCreateError',
    defaultMessage: 'Error creating product: {error}',
  },
  // Search related messages
  searchPlaceholder: {
    id: 'Products.searchPlaceholder',
    defaultMessage: 'Search by name, description or SKU...',
  },
  searchButton: {
    id: 'Products.searchButton',
    defaultMessage: 'Search',
  },
  searchResults: {
    id: 'Products.searchResults',
    defaultMessage: 'Found {count} products matching "{query}"',
  },
  searchingProducts: {
    id: 'Products.searchingProducts',
    defaultMessage: 'Searching products...',
  },
  noSearchResults: {
    id: 'Products.noSearchResults',
    defaultMessage: 'No products found for "{query}"',
  },
  tryDifferentSearch: {
    id: 'Products.tryDifferentSearch',
    defaultMessage: 'Try a different search term or browse the master catalog.',
  },
  productType: {
    id: 'Products.productType',
    defaultMessage: 'Product Type',
  },
});
