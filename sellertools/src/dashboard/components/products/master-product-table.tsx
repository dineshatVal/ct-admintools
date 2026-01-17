import DataTable from '@commercetools-uikit/data-table';
import { usePaginationState } from '@commercetools-uikit/hooks';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import { ErrorMessage } from '@commercetools-uikit/messages';
import { Pagination } from '@commercetools-uikit/pagination';
import PrimaryButton from '@commercetools-uikit/primary-button';
import SearchTextInput from '@commercetools-uikit/search-text-input';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import useStoreProducts from '../../hooks/use-store-products/use-store-products';
import logger from '../../../utils/logger';
import messages from './messages';
import { CheckboxCell, ImageCell } from './products';
import styles from './products.module.css';
import { useProductWrapper } from './store-products-wrapper';
import { ProductData } from '../../hooks/use-store-products/types';

const MasterProductTable = () => {
  const intl = useIntl();

  const latestSearchQueryRef = useRef<string>('');

  const { fetchUserStoreProducts } = useProductWrapper();

  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [masterProducts, setMasterProducts] = useState<ProductData[]>([]);
  const [isAddingProducts, setIsAddingProducts] = useState(false);
  const [total, setTotal] = useState(0);

  const { page, perPage } = usePaginationState();

  const { fetchMasterStoreProducts, addProductsToStore, searchMasterProducts } =
    useStoreProducts({ page, perPage });

  const handleProductSelection = (productId: string) => {
    setSelectedProducts((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const columns = [
    {
      key: 'select',
      label: 'Select',
      renderItem: (item: ProductData) => (
        <CheckboxCell
          item={item}
          onToggle={() => handleProductSelection(item.id)}
          tableId="master"
        />
      ),
      width: '12%',
    },
    {
      key: 'image',
      label: 'Image',
      renderItem: (item: ProductData) => <ImageCell value={item.image} />,
      width: '120px',
    },
    { key: 'name', label: 'Product Name', width: '50%' },
    { key: 'sku', label: 'SKU', width: '25%', isTruncated: true },
  ];

  const handleAddProductsToStore = async () => {
    if (selectedProducts.length === 0) return;

    setIsAddingProducts(true);
    try {
      const success = await addProductsToStore(selectedProducts);

      if (success) {
        // Refresh the store products to show the newly added items
        await fetchUserStoreProducts();
        await fetchMasterProducts();
        // Clear selections after successful addition
        setSelectedProducts([]);
      }
    } catch (err) {
      logger.error('Error adding products to store:', err);
    } finally {
      setIsAddingProducts(false);
    }
  };

  const fetchMasterProducts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      logger.info('Fetching products for master-store');
      const result = await fetchMasterStoreProducts();

      if (result) {
        logger.info(
          `Fetched ${result.results.length} products from master-store`
        );
        // Mark previously selected products
        const updatedProducts = result.results.map((product) => ({
          ...product,
          isSelected: selectedProducts.includes(product.id),
        }));
        setMasterProducts(updatedProducts);
        setTotal(result.total);
      } else {
        logger.info('No products returned for master-store');
        setMasterProducts([]);
        setTotal(0);
      }
    } catch (err) {
      logger.error('Error fetching master-store products:', err);
      setError(
        err instanceof Error
          ? err
          : new Error('Unknown error fetching master-store products')
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle product search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // If search is empty, fetch regular master products list
      fetchMasterProducts();
      return;
    }

    // Keep track of the current search query
    latestSearchQueryRef.current = searchQuery;

    setIsSearching(true);
    setError(null);

    // Store the current search query for this request
    const currentSearchQuery = searchQuery;

    try {
      logger.info(`Executing search with query: "${currentSearchQuery}"`);
      const searchResults = await searchMasterProducts(currentSearchQuery);

      // Only process the results if this is still the latest search query
      if (currentSearchQuery !== latestSearchQueryRef.current) {
        logger.info(
          'Search query changed since search started, abandoning results'
        );
        return;
      }

      logger.info('Search results received:', searchResults);

      // Mark previously selected products
      const updatedProducts = searchResults.results.map((product) => ({
        ...product,
        isSelected: selectedProducts.includes(product.id),
      }));

      // Don't filter out products already in store - just show all search results
      // This way users can see all matching products, even if they're already in their store
      setMasterProducts(updatedProducts);
      setTotal(searchResults.total);
    } catch (err) {
      // Only set error if this is still the latest search query
      if (currentSearchQuery === latestSearchQueryRef.current) {
        logger.error('Error searching products:', err);
        setError(
          err instanceof Error ? err : new Error('Error searching products')
        );
      }
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchMasterProducts();
  }, [fetchMasterStoreProducts]);

  useEffect(() => {
    // Update selected state when selectedProducts changes
    setMasterProducts((prev) =>
      prev.map((product) => ({
        ...product,
        isSelected: selectedProducts.includes(product.id),
      }))
    );
  }, [selectedProducts]);

  return (
    <div className={styles.tableSection}>
      <Spacings.Stack scale="l">
        <Text.Subheadline as="h4">
          {intl.formatMessage(messages.masterProductsTitle)}
        </Text.Subheadline>

        {/* Search bar */}
        <div className={styles.searchContainer}>
          <SearchTextInput
            value={searchQuery}
            onSubmit={handleSearch}
            onReset={() => {
              setSearchQuery('');
              fetchMasterProducts();
            }}
            onChange={(event) => {
              const newValue = event.target.value;
              setSearchQuery(newValue);

              // Immediately trigger search without debounce
              if (!newValue.trim()) {
                fetchMasterProducts();
              } else {
                handleSearch();
              }
            }}
            placeholder="Search products..."
          />
        </div>

        <Text.Body>
          {intl.formatMessage(messages.masterProductsDescription)}
        </Text.Body>

        <Spacings.Inline justifyContent="space-between" alignItems="center">
          <Text.Body>
            {searchQuery
              ? intl.formatMessage(messages.searchResults, {
                  count: total,
                  query: searchQuery,
                })
              : intl.formatMessage(messages.masterProductsCount, {
                  count: total,
                })}
          </Text.Body>

          {selectedProducts.length > 0 && (
            <Spacings.Inline scale="s" alignItems="center">
              <Text.Body tone="secondary">
                {intl.formatMessage(messages.selectedProducts, {
                  count: selectedProducts.length,
                  plural: selectedProducts.length !== 1 ? 's' : '',
                })}
              </Text.Body>
              <PrimaryButton
                label={
                  isAddingProducts
                    ? intl.formatMessage(messages.adding)
                    : intl.formatMessage(messages.addToStore)
                }
                onClick={handleAddProductsToStore}
                isDisabled={isAddingProducts}
              />
            </Spacings.Inline>
          )}
        </Spacings.Inline>

        {isLoading || isSearching ? (
          <div className={styles.loadingContainer}>
            <LoadingSpinner scale="l" />
            <Text.Body>
              {isSearching
                ? intl.formatMessage(messages.searchingProducts)
                : intl.formatMessage(messages.loadingMasterProducts)}
            </Text.Body>
          </div>
        ) : error ? (
          <ErrorMessage>
            {intl.formatMessage(messages.errorMasterProducts, {
              error: error.message,
            })}
          </ErrorMessage>
        ) : masterProducts.length === 0 ? (
          <div className={styles.emptyState}>
            <Text.Headline as="h3">
              {searchQuery
                ? intl.formatMessage(messages.noSearchResults, {
                    query: searchQuery,
                  })
                : intl.formatMessage(messages.noMasterProducts)}
            </Text.Headline>
            <Text.Body>
              {searchQuery
                ? intl.formatMessage(messages.tryDifferentSearch)
                : intl.formatMessage(messages.noMasterProductsDesc)}
            </Text.Body>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            {isSearching && (
              <div className={styles.searchOverlay}>
                <LoadingSpinner scale="s" />
                <Text.Body>
                  {intl.formatMessage(messages.searchingProducts)}
                </Text.Body>
              </div>
            )}
            <DataTable
              columns={columns}
              rows={masterProducts}
              maxHeight="60vh"
              maxWidth="100%"
              isCondensed
            />
            <Pagination
              page={page.value}
              onPageChange={page.onChange}
              perPage={perPage.value}
              onPerPageChange={perPage.onChange}
              totalItems={total}
            />
          </div>
        )}
      </Spacings.Stack>
    </div>
  );
};

export default MasterProductTable;
