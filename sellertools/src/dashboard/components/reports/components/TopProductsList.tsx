import React from 'react';
import Text from '@commercetools-uikit/text';
import Card from '@commercetools-uikit/card';
import SelectField from '@commercetools-uikit/select-field';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import type { TopProduct } from '../../../hooks/use-reports/use-top-products';
import type { TimePeriod } from '../../../hooks/use-reports/use-top-products';
import styles from '../reports.module.css';

interface TopProductsListProps {
  topProducts: TopProduct[];
  loading: boolean;
  currentPeriod: string;
  selectedPeriod: TimePeriod;
  onPeriodChange: (event: any) => void;
  formatCurrency: (value: number, currencyCode: string) => string;
}

const periodOptions = [
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
];

const TopProductsList: React.FC<TopProductsListProps> = ({
  topProducts,
  loading,
  currentPeriod,
  selectedPeriod,
  onPeriodChange,
  formatCurrency,
}) => {
  return (
    <Card className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <Text.Headline as="h2">
          Top 5 Products by Revenue for {currentPeriod}
        </Text.Headline>
        <SelectField
          horizontalConstraint={6}
          title="Time Period"
          name="top-products-period"
          value={selectedPeriod}
          options={periodOptions}
          onChange={onPeriodChange}
        />
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <LoadingSpinner scale="s" />
        </div>
      ) : topProducts.length > 0 ? (
        <div className={styles.topProductsGrid}>
          {topProducts.map((product) => (
            <div key={product.productId} className={styles.topProductCard}>
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className={styles.productImage}
                />
              ) : (
                <div className={styles.noImagePlaceholder}>
                  <Text.Body>No Image</Text.Body>
                </div>
              )}
              <div className={styles.productName}>{product.name}</div>
              <div className={styles.productRevenue}>
                {formatCurrency(product.revenue, product.currencyCode)}
              </div>
              <div className={styles.statLabel}>Qty: {product.quantity}</div>
            </div>
          ))}
        </div>
      ) : (
        <Text.Body>No product data available for the selected period</Text.Body>
      )}
    </Card>
  );
};

export default TopProductsList;
