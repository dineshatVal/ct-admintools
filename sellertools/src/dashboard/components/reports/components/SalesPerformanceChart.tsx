import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Text from '@commercetools-uikit/text';
import Card from '@commercetools-uikit/card';
import SelectField from '@commercetools-uikit/select-field';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import type { SalesDataPoint } from '../../../hooks/use-reports/use-sales-performance';
import type { TimePeriod } from '../../../hooks/use-reports/use-sales-performance';
import styles from '../reports.module.css';

interface SalesPerformanceChartProps {
  salesData: SalesDataPoint[];
  loading: boolean;
  currentPeriod: TimePeriod;
  onPeriodChange: (event: any) => void;
  formatCurrency: (value: number, currencyCode: string) => string;
}

const periodOptions = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
];

const SalesPerformanceChart: React.FC<SalesPerformanceChartProps> = ({
  salesData,
  loading,
  currentPeriod,
  onPeriodChange,
  formatCurrency,
}) => {
  return (
    <Card className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <Text.Headline as="h2">Sales Performance</Text.Headline>
        <SelectField
          horizontalConstraint={6}
          title="Time Period"
          name="sales-period"
          value={currentPeriod}
          options={periodOptions}
          onChange={onPeriodChange}
        />
      </div>

      <div className={styles.chartContainer}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <LoadingSpinner scale="s" />
          </div>
        ) : salesData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={salesData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis
                label={{
                  value: salesData[0]?.currencyCode || 'USD',
                  angle: -90,
                  position: 'insideLeft',
                  offset: -5,
                }}
              />
              <Tooltip
                formatter={(value: any) => [
                  formatCurrency(
                    Number(value),
                    salesData[0]?.currencyCode || 'USD'
                  ),
                  'Revenue',
                ]}
              />
              <Bar dataKey="value" fill="#8884d8" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Text.Body>No sales data available for the selected period</Text.Body>
        )}
      </div>
    </Card>
  );
};

export default SalesPerformanceChart;
