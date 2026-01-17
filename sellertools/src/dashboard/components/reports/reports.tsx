import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import Text from '@commercetools-uikit/text';
import Spacings from '@commercetools-uikit/spacings';
import PrimaryButton from '@commercetools-uikit/primary-button';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import { ContentNotification } from '@commercetools-uikit/notifications';
import { useAuthContext } from '../../contexts/auth-context';
import {
  useSalesPerformance,
  useTotalSales,
  useAverageOrderValue,
  useTopProducts,
} from '../../hooks/use-reports';
import type { TimePeriod as SalesPerformancePeriod } from '../../hooks/use-reports/use-sales-performance';
import type { TimePeriod as TopProductsPeriod } from '../../hooks/use-reports/use-top-products';
import {
  SalesPerformanceChart,
  TotalSalesStats,
  AverageOrderValueStats,
  TopProductsList,
} from './components';
import styles from './reports.module.css';

type Props = {
  onBack: () => void;
  linkToWelcome: string;
};

// Format currency values
const formatCurrency = (value: number, currencyCode: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(value);
};

const Reports: React.FC<Props> = ({ onBack, linkToWelcome }) => {
  const intl = useIntl();
  const { storeKey } = useAuthContext();

  // State for selected periods
  const [salesPeriod, setSalesPeriod] =
    useState<SalesPerformancePeriod>('year');
  const [topProductsPeriod, setTopProductsPeriod] =
    useState<TopProductsPeriod>('month');

  // Initialize hooks
  const {
    salesData,
    loading: salesLoading,
    error: salesError,
    fetchSalesData,
  } = useSalesPerformance();

  const {
    totals: salesTotals,
    loading: totalSalesLoading,
    error: totalSalesError,
    fetchTotalSales,
  } = useTotalSales();

  const {
    averages,
    loading: avgOrderLoading,
    error: avgOrderError,
    fetchAverageOrderValues,
  } = useAverageOrderValue();

  const {
    topProducts,
    loading: topProductsLoading,
    error: topProductsError,
    currentPeriod,
    fetchTopProducts,
  } = useTopProducts();

  // Load data on component mount and when store key changes
  useEffect(() => {
    if (storeKey) {
      fetchSalesData(storeKey, salesPeriod);
      fetchTotalSales(storeKey);
      fetchAverageOrderValues(storeKey);
      fetchTopProducts(storeKey, topProductsPeriod);
    }
  }, [
    storeKey,
    fetchSalesData,
    fetchTotalSales,
    fetchAverageOrderValues,
    fetchTopProducts,
  ]);

  // Handle period changes
  const handleSalesPeriodChange = (event: any) => {
    const newPeriod = event.target.value as SalesPerformancePeriod;
    setSalesPeriod(newPeriod);
    if (storeKey) {
      fetchSalesData(storeKey, newPeriod);
    }
  };

  const handleTopProductsPeriodChange = (event: any) => {
    const newPeriod = event.target.value as TopProductsPeriod;
    setTopProductsPeriod(newPeriod);
    if (storeKey) {
      fetchTopProducts(storeKey, newPeriod);
    }
  };

  // Determine if any data is loading
  const isLoading =
    salesLoading && totalSalesLoading && avgOrderLoading && topProductsLoading;

  // Render the percent change indicator
  const renderPercentChange = (change: number) => {
    const isPositive = change >= 0;
    return (
      <div
        className={`${styles.percentChange} ${
          isPositive ? styles.positive : styles.negative
        }`}
      >
        {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}% from last period
      </div>
    );
  };

  return (
    <div className={styles.reportsContainer}>
      <Spacings.Stack scale="l">
        <div className={styles.header}>
          <div>
            <Text.Headline as="h1">Reports</Text.Headline>
            <Text.Subheadline>
              Store:{' '}
              <span className={styles.storeKeyHighlight}>{storeKey}</span>
            </Text.Subheadline>
          </div>
          <Spacings.Inline scale="s">
            <PrimaryButton label="Back to Dashboard" onClick={onBack} />
          </Spacings.Inline>
        </div>

        {/* Error handling */}
        {(salesError ||
          totalSalesError ||
          avgOrderError ||
          topProductsError) && (
          <ContentNotification type="error">
            <Text.Body>
              {salesError?.message ||
                totalSalesError?.message ||
                avgOrderError?.message ||
                topProductsError?.message}
            </Text.Body>
          </ContentNotification>
        )}

        {isLoading ? (
          <div className={styles.loadingContainer}>
            <LoadingSpinner scale="l" />
            <Text.Body>Loading report data...</Text.Body>
          </div>
        ) : (
          <>
            {/* Total Sales Stats */}
            <TotalSalesStats
              salesTotals={salesTotals}
              formatCurrency={formatCurrency}
              renderPercentChange={renderPercentChange}
            />

            {/* Sales Performance Chart */}
            <SalesPerformanceChart
              salesData={salesData}
              loading={salesLoading}
              currentPeriod={salesPeriod}
              onPeriodChange={handleSalesPeriodChange}
              formatCurrency={formatCurrency}
            />

            {/* Average Order Value */}
            <AverageOrderValueStats
              averages={averages}
              formatCurrency={formatCurrency}
              renderPercentChange={renderPercentChange}
            />

            {/* Top 5 Products */}
            <TopProductsList
              topProducts={topProducts}
              loading={topProductsLoading}
              currentPeriod={currentPeriod}
              selectedPeriod={topProductsPeriod}
              onPeriodChange={handleTopProductsPeriodChange}
              formatCurrency={formatCurrency}
            />
          </>
        )}
      </Spacings.Stack>
    </div>
  );
};

export default Reports;
