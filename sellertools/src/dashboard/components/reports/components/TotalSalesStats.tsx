import React from 'react';
import Text from '@commercetools-uikit/text';
import Card from '@commercetools-uikit/card';
import type { SalesTotals } from '../../../hooks/use-reports/use-total-sales';
import styles from '../reports.module.css';

interface TotalSalesStatsProps {
  salesTotals: SalesTotals;
  formatCurrency: (value: number, currencyCode: string) => string;
  renderPercentChange: (change: number) => React.ReactNode;
}

const TotalSalesStats: React.FC<TotalSalesStatsProps> = ({
  salesTotals,
  formatCurrency,
  renderPercentChange,
}) => {
  return (
    <div className={styles.statsGrid}>
      <Card className={styles.statsCard}>
        <Text.Subheadline>Today</Text.Subheadline>
        <div className={styles.statValue}>
          {formatCurrency(
            salesTotals.today.amount,
            salesTotals.today.currencyCode
          )}
        </div>
        <div className={styles.statLabel}>
          {salesTotals.today.orderCount} orders
        </div>
        <div className={styles.statLabel}>— not enough data available</div>
      </Card>

      <Card className={styles.statsCard}>
        <Text.Subheadline>This Week</Text.Subheadline>
        <div className={styles.statValue}>
          {formatCurrency(
            salesTotals.week.amount,
            salesTotals.week.currencyCode
          )}
        </div>
        <div className={styles.statLabel}>
          {salesTotals.week.orderCount} orders
        </div>
        {renderPercentChange(salesTotals.week.percentChange)}
      </Card>

      <Card className={styles.statsCard}>
        <Text.Subheadline>This Month</Text.Subheadline>
        <div className={styles.statValue}>
          {formatCurrency(
            salesTotals.month.amount,
            salesTotals.month.currencyCode
          )}
        </div>
        <div className={styles.statLabel}>
          {salesTotals.month.orderCount} orders
        </div>
        {renderPercentChange(salesTotals.month.percentChange)}
      </Card>
    </div>
  );
};

export default TotalSalesStats;
