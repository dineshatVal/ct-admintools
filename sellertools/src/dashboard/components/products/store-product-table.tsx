import DataTable from '@commercetools-uikit/data-table';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import { ErrorMessage } from '@commercetools-uikit/messages';
import { Pagination } from '@commercetools-uikit/pagination';
import SearchTextInput from '@commercetools-uikit/search-text-input';
import SecondaryButton from '@commercetools-uikit/secondary-button';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import { useIntl } from 'react-intl';
import messages from './messages';
import { CheckboxCell, ImageCell } from './products';
import styles from './products.module.css';
import { useProductWrapper } from './store-products-wrapper';
import { ProductData } from '../../hooks/use-store-products/types';
import { useHistory } from 'react-router-dom';

const StoreProductTable = ({ linkToWelcome }: { linkToWelcome: string }) => {
  const intl = useIntl();
  const history = useHistory();
  const {
    handleStoreProductSelection,
    handleStoreSearch,
    storeSearchQuery,
    setStoreSearchQuery,
    setFilteredStoreProducts,
    filteredStoreProducts,
    selectedStoreProducts,
    isStoreSearching,
    isRemovingProducts,
    isStoreProductsLoading,
    storeProductsError,
    storeProducts,
    handleRemoveProductsFromStore,
    page,
    perPage,
    total,
  } = useProductWrapper();

  const storeProductColumns = [
    {
      key: 'select',
      label: 'Select',
      renderItem: (item: ProductData) => (
        <CheckboxCell
          item={item}
          onToggle={() => handleStoreProductSelection(item.id)}
          tableId="store"
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

  return (
    <div className={styles.tableSection}>
      <Spacings.Stack scale="l">
        <Text.Subheadline as="h4">
          {intl.formatMessage(messages.storeProductsTitle)}
        </Text.Subheadline>
        {/* Store Products Search bar */}
        <div className={styles.searchContainer}>
          <SearchTextInput
            value={storeSearchQuery}
            onSubmit={handleStoreSearch}
            onReset={() => {
              setStoreSearchQuery('');
              setFilteredStoreProducts(storeProducts);
            }}
            onChange={(event) => {
              const newValue = event.target.value;
              setStoreSearchQuery(newValue);

              // Immediately trigger search without debounce
              if (!newValue.trim()) {
                setFilteredStoreProducts(storeProducts);
              } else {
                handleStoreSearch();
              }
            }}
            placeholder="Search store's products..."
          />
        </div>

        <Text.Body>
          {intl.formatMessage(messages.storeProductsDescription)}
        </Text.Body>

        <Spacings.Inline justifyContent="space-between" alignItems="center">
          <Text.Body>
            {storeSearchQuery
              ? intl.formatMessage(messages.searchResults, {
                  count: total,
                  query: storeSearchQuery,
                })
              : intl.formatMessage(messages.storeProductsCount, {
                  count: total,
                })}
          </Text.Body>

          {selectedStoreProducts.length > 0 && (
            <Spacings.Inline scale="s" alignItems="center">
              <Text.Body tone="secondary">
                {intl.formatMessage(messages.selectedProducts, {
                  count: selectedStoreProducts.length,
                  plural: selectedStoreProducts.length !== 1 ? 's' : '',
                })}
              </Text.Body>
              <SecondaryButton
                label={
                  isRemovingProducts
                    ? intl.formatMessage(messages.removing)
                    : intl.formatMessage(messages.removeFromStore)
                }
                onClick={handleRemoveProductsFromStore}
                isDisabled={isRemovingProducts}
              />
            </Spacings.Inline>
          )}
        </Spacings.Inline>

        {isStoreProductsLoading || isStoreSearching ? (
          <div className={styles.loadingContainer}>
            <LoadingSpinner scale="l" />
            <Text.Body>
              {isStoreSearching
                ? intl.formatMessage(messages.searchingProducts)
                : intl.formatMessage(messages.loadingStoreProducts)}
            </Text.Body>
          </div>
        ) : storeProductsError ? (
          <ErrorMessage>
            {intl.formatMessage(messages.errorStoreProducts, {
              error: storeProductsError.message,
            })}
          </ErrorMessage>
        ) : filteredStoreProducts.length === 0 ? (
          <div className={styles.emptyState}>
            <Text.Headline as="h3">
              {storeSearchQuery
                ? intl.formatMessage(messages.noSearchResults, {
                    query: storeSearchQuery,
                  })
                : intl.formatMessage(messages.noStoreProducts)}
            </Text.Headline>
            <Text.Body>
              {storeSearchQuery
                ? intl.formatMessage(messages.tryDifferentSearch)
                : intl.formatMessage(messages.noStoreProductsDesc)}
            </Text.Body>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            {isStoreSearching && (
              <div className={styles.searchOverlay}>
                <LoadingSpinner scale="s" />
                <Text.Body>
                  {intl.formatMessage(messages.searchingProducts)}
                </Text.Body>
              </div>
            )}
            <DataTable
              columns={storeProductColumns}
              rows={filteredStoreProducts}
              maxHeight="60vh"
              maxWidth="100%"
              onRowClick={(row) => {
                history.push(`${linkToWelcome}/products/${row.id}`);
              }}
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

export default StoreProductTable;
