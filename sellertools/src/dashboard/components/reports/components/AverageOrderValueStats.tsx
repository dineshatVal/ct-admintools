import React from 'react';
import Text from '@commercetools-uikit/text';
import Card from '@commercetools-uikit/card';
import type { AverageOrderValues } from '../../../hooks/use-reports/use-average-order-value';
import styles from '../reports.module.css';

interface AverageOrderValueStatsProps {
  averages: AverageOrderValues;
  formatCurrency: (value: number, currencyCode: string) => string;
  renderPercentChange: (change: number) => React.ReactNode;
}

const AverageOrderValueStats: React.FC<AverageOrderValueStatsProps> = ({
  averages,
  formatCurrency,
  renderPercentChange,
}) => {
  return (
    <Card className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <Text.Headline as="h2">Average Order Value</Text.Headline>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statsCard}>
          <Text.Subheadline>This Week</Text.Subheadline>
          <div className={styles.statValue}>
            {formatCurrency(averages.week.value, averages.week.currencyCode)}
          </div>
          {renderPercentChange(averages.week.percentChange)}
        </div>

        <div className={styles.statsCard}>
          <Text.Subheadline>This Month</Text.Subheadline>
          <div className={styles.statValue}>
            {formatCurrency(averages.month.value, averages.month.currencyCode)}
          </div>
          {renderPercentChange(averages.month.percentChange)}
        </div>

        <div className={styles.statsCard}>
          <Text.Subheadline>This Year</Text.Subheadline>
          <div className={styles.statValue}>
            {formatCurrency(averages.year.value, averages.year.currencyCode)}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AverageOrderValueStats;
