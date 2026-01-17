import DataTable from '@commercetools-uikit/data-table';
import { RefreshIcon } from '@commercetools-uikit/icons';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import { ErrorMessage } from '@commercetools-uikit/messages';
import PrimaryButton from '@commercetools-uikit/primary-button';
import SearchTextInput from '@commercetools-uikit/search-text-input';
import SecondaryButton from '@commercetools-uikit/secondary-button';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import React, { useEffect, useRef, useState } from 'react';
import { useAuthContext } from '../../contexts/auth-context';
import usePriceManagement from '../../hooks/use-price-management/use-price-management';
import styles from './prices.module.css';
import { Pagination } from '@commercetools-uikit/pagination';
import { usePaginationState } from '@commercetools-uikit/hooks';
interface PricesProps {
  linkToWelcome: string;
  onBack: () => void;
}

// Product type definition with price information
interface ProductPriceData {
  id: string;
  name: string;
  image: string;
  sku: string;
  version: number;
  currentPrice?: {
    id: string;
    value: number;
    currencyCode: string;
  };
  masterPrice?: {
    id: string;
    value: number;
    currencyCode: string;
  };
}

// Calculate profit margin as a percentage
const calculateProfitMargin = (
  storePrice?: number,
  masterPrice?: number
): string => {
  if (!storePrice || !masterPrice || masterPrice === 0) return 'N/A';

  const margin = ((storePrice - masterPrice) / masterPrice) * 100;
  return `${margin.toFixed(2)}%`;
};

// Custom cell renderer for the image column
const ImageCell = ({ value }: { value: string }) => (
  <div className={styles.imageContainer}>
    <img src={value} alt="Product" className={styles.productImage} />
  </div>
);

// Custom cell renderer for the price input
const PriceInputCell = ({
  product,
  storeKey,
  onPriceChange,
}: {
  product: ProductPriceData;
  storeKey: string;
  onPriceChange: (
    productId: string,
    version: number,
    price: number,
    channelKey: string,
    priceId?: string
  ) => void;
}) => {
  const [price, setPrice] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    // Set the component as mounted
    isMounted.current = true;

    // Cleanup function to prevent state updates after unmounting
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrice(e.target.value);
  };

  const handlePriceSubmit = async () => {
    const numericPrice = parseFloat(price);
    if (!isNaN(numericPrice) && numericPrice > 0) {
      setIsUpdating(true);
      try {
        await onPriceChange(
          product.id,
          product.version,
          numericPrice,
          storeKey,
          product.currentPrice?.id
        );
      } finally {
        // Only update state if the component is still mounted
        if (isMounted.current) {
          setIsUpdating(false);
          // Clear the input field after successful submission
          setPrice('');
        }
      }
    }
  };

  return (
    <div className={styles.priceInputContainer}>
      <input
        type="number"
        min="0"
        step="0.01"
        value={price}
        onChange={handlePriceChange}
        placeholder="Enter price"
        className={styles.priceInput}
        disabled={isUpdating}
      />
      <PrimaryButton
        label={isUpdating ? 'Updating...' : 'Update'}
        onClick={handlePriceSubmit}
        isDisabled={isUpdating || !price || parseFloat(price) <= 0}
        size="small"
      />
    </div>
  );
};

const Prices: React.FC<PricesProps> = ({ linkToWelcome, onBack }) => {
  const { storeKey, productSelectionId } = useAuthContext();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [products, setProducts] = useState<ProductPriceData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalProducts, setTotalProducts] = useState(0);
  const { page, perPage } = usePaginationState();

  // Ref for debouncing search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { fetchProductsWithPrices, updateProductPrice } = usePriceManagement({
    page,
    perPage,
  });

  // Clean up the search timeout when component unmounts
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const fetchProducts = async () => {
    try {
      const result = await fetchProductsWithPrices();
      setProducts(result.results);
      setTotalProducts(result.total);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error('Unknown error fetching products')
      );
      setTotalProducts(0);
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    if (!productSelectionId) {
      return;
    }
    setIsInitialLoading(true);
    fetchProducts();
  }, [productSelectionId]);

  const handlePriceChange = async (
    productId: string,
    version: number,
    newPrice: number,
    channelKey: string,
    priceId?: string
  ) => {
    try {
      const success = await updateProductPrice(
        productId,
        version,
        newPrice,
        channelKey,
        priceId
      );

      if (success) {
        // Refresh the products list to show updated prices
        await fetchProducts();
      }
    } catch (err) {
      console.error('Error updating price:', err);
    }
  };

  // Execute search with the current query
  const executeSearch = async (query: string) => {
    if (!query.trim()) {
      fetchProducts();
      return;
    }

    setIsSearchLoading(true);
    setError(null);

    try {
      const result = await fetchProductsWithPrices(query);

      if (result.results.length > 0) {
        setProducts(result.results);
        setTotalProducts(result.total);
      } else {
        setProducts([]);
        setTotalProducts(0);
      }
    } catch (err) {
      console.error('Error searching products:', err);
      setError(
        err instanceof Error ? err : new Error('Error searching products')
      );
    } finally {
      setIsSearchLoading(false);
    }
  };

  const columns = [
    {
      key: 'image',
      label: 'Image',
      renderItem: (item: ProductPriceData) => <ImageCell value={item.image} />,
      width: '10%',
    },
    { key: 'name', label: 'Product Name', width: '25%' },
    { key: 'sku', label: 'SKU', width: '15%' },
    {
      key: 'masterPrice',
      label: 'Cost',
      renderItem: (item: ProductPriceData) => (
        <Text.Body>
          {item.masterPrice
            ? `$${item.masterPrice.value.toFixed(2)}`
            : 'Not set'}
        </Text.Body>
      ),
      width: '12.5%',
    },
    {
      key: 'currentPrice',
      label: 'Your Price',
      renderItem: (item: ProductPriceData) => (
        <Text.Body>
          {item.currentPrice
            ? `$${item.currentPrice.value.toFixed(2)}`
            : 'Not set'}
        </Text.Body>
      ),
      width: '12.5%',
    },
    {
      key: 'profitMargin',
      label: '(+/-)',
      renderItem: (item: ProductPriceData) => (
        <Text.Body>
          {calculateProfitMargin(
            item.currentPrice?.value,
            item.masterPrice?.value
          )}
        </Text.Body>
      ),
      width: '10%',
    },
    {
      key: 'newPrice',
      label: 'New Price',
      renderItem: (item: ProductPriceData) => (
        <PriceInputCell
          product={item}
          storeKey={storeKey!}
          onPriceChange={handlePriceChange}
        />
      ),
      width: '15%',
    },
  ];

  return (
    <div className={styles.container}>
      <Spacings.Stack scale="l">
        <div className={styles.header}>
          <div>
            <Text.Headline as="h1">Manage Prices</Text.Headline>
            <Text.Subheadline as="h4">
              Store:{' '}
              <span className={styles.storeKeyHighlight}>{storeKey}</span>
            </Text.Subheadline>
          </div>
          <Spacings.Inline scale="s">
            <SecondaryButton
              iconLeft={<RefreshIcon />}
              label="Refresh"
              onClick={fetchProducts}
              isDisabled={isInitialLoading || isSearchLoading}
            />
            <PrimaryButton label="Back to Dashboard" onClick={onBack} />
          </Spacings.Inline>
        </div>

        {/* Search bar */}
        <div className={styles.searchContainer} style={{ maxWidth: '600px' }}>
          <SearchTextInput
            value={searchQuery}
            onSubmit={executeSearch}
            onReset={() => {
              setSearchQuery('');
              fetchProducts();
            }}
            onChange={(event) => {
              const newValue = event.target.value;
              setSearchQuery(newValue);

              // Debounce search to avoid too many API calls
              if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
              }

              searchTimeoutRef.current = setTimeout(() => {
                executeSearch(newValue);
              }, 500); // 500ms debounce
            }}
            placeholder="Search products..."
          />
        </div>

        {/* Initial loading state */}
        {isInitialLoading ? (
          <div className={styles.loadingContainer}>
            <LoadingSpinner scale="l" />
            <Text.Body>Loading products and prices...</Text.Body>
          </div>
        ) : error ? (
          <ErrorMessage>Error loading products: {error.message}</ErrorMessage>
        ) : products.length === 0 ? (
          <div className={styles.emptyState}>
            <Text.Headline as="h3">
              {searchQuery
                ? `No products found matching "${searchQuery}"`
                : 'No products found'}
            </Text.Headline>
            <Text.Body>
              {searchQuery
                ? 'Try a different search term or clear the search'
                : "There are no products in your store's catalog."}
            </Text.Body>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            {isSearchLoading && (
              <div className={styles.searchOverlay}>
                <LoadingSpinner scale="s" />
                <Text.Body>Searching products...</Text.Body>
              </div>
            )}
            <DataTable
              columns={columns}
              rows={products}
              maxHeight="70vh"
              maxWidth="100%"
            />
            <Pagination
              page={page.value}
              onPageChange={page.onChange}
              perPage={perPage.value}
              onPerPageChange={perPage.onChange}
              totalItems={totalProducts}
            />
          </div>
        )}
      </Spacings.Stack>
    </div>
  );
};

export default Prices;
