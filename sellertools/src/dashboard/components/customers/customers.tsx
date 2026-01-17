import React, { useEffect, useState } from 'react';
import DataTable from '@commercetools-uikit/data-table';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import Text from '@commercetools-uikit/text';
import Spacings from '@commercetools-uikit/spacings';
import PrimaryButton from '@commercetools-uikit/primary-button';
import SecondaryButton from '@commercetools-uikit/secondary-button';
import { RefreshIcon } from '@commercetools-uikit/icons';
import { ErrorMessage } from '@commercetools-uikit/messages';
import useStoreCustomers from '../../hooks/use-store-customers';
import styles from './customers.module.css';
import { useAuthContext } from '../../contexts/auth-context';
import { useHistory } from 'react-router-dom';
import { usePaginationState } from '@commercetools-uikit/hooks';
import { useDataTableSortingState } from '@commercetools-uikit/hooks';
import { Pagination } from '@commercetools-uikit/pagination';
interface CustomersProps {
  onBack: () => void;
  linkToWelcome: string;
}

interface CustomerWithGroup {
  id: string;
  lastName: string;
  email: string;
  customerGroup?: string;
  rawData: any;
}

const Customers: React.FC<CustomersProps> = ({ onBack, linkToWelcome }) => {
  const history = useHistory();
  const { page, perPage } = usePaginationState();
  const tableSorting = useDataTableSortingState();
  const { fetchCustomersByStore, customers, loading, error, total } =
    useStoreCustomers({ page, perPage, tableSorting });
  const { storeKey } = useAuthContext();
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [enhancedCustomers, setEnhancedCustomers] = useState<
    CustomerWithGroup[]
  >([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  useEffect(() => {
    if (storeKey) {
      console.log(`Loading customers for store: ${storeKey}`);
      fetchCustomersByStore(storeKey).then(() => {
        setLastRefreshed(new Date().toLocaleString());
      });
      setIsFirstLoad(false);
    } else {
      console.warn('No store key provided, cannot load customers');
    }
  }, [storeKey, fetchCustomersByStore]);

  // Fetch customer group names when customers change
  useEffect(() => {
    const enrichCustomersWithGroups = async () => {
      if (customers.length === 0) return;

      setEnhancedCustomers(
        customers.map((customer) => ({
          id: customer.id,
          lastName:
            `${customer.firstName || ''} ${customer.lastName || ''}`.trim() ||
            'N/A',
          email: customer.email,
          'customerGroup.id': customer.customerGroup?.name || 'N/A',
          rawData: customer,
        }))
      );
      setLoadingGroups(false);
    };

    enrichCustomersWithGroups();
  }, [customers]);

  const handleRowClick = (row: any) => {
    // Skip handling if we don't have the raw data
    if (!row || !row.rawData) {
      return;
    }

    // Navigate to the customer details page
    history.push(`${linkToWelcome}/customers/${row.id}`);
  };

  const handleRefreshCustomers = () => {
    if (storeKey) {
      console.log(`Manually refreshing customers for store: ${storeKey}`);
      fetchCustomersByStore(storeKey).then(() => {
        setLastRefreshed(new Date().toLocaleString());
      });
    }
  };

  // Define columns for the table
  const columns = [
    { key: 'lastName', label: 'Customer Name', isSortable: true },
    { key: 'email', label: 'Email', isSortable: true },
    { key: 'customerGroup.id', label: 'Customer Group', isSortable: true },
  ];

  const isLoading = loading || isFirstLoad || loadingGroups;

  return (
    <div className={styles.customersContainer}>
      <Spacings.Stack scale="l">
        <div className={styles.header}>
          <div>
            <Text.Headline as="h1">Customers</Text.Headline>
            <Text.Subheadline>
              Store:{' '}
              <span className={styles.storeKeyHighlight}>{storeKey}</span>
            </Text.Subheadline>
            {lastRefreshed && (
              <Text.Detail tone="secondary">
                Last refreshed: {lastRefreshed}
              </Text.Detail>
            )}
          </div>
          <Spacings.Inline scale="s">
            <SecondaryButton
              iconLeft={<RefreshIcon />}
              label="Refresh"
              onClick={handleRefreshCustomers}
              isDisabled={isLoading}
            />
            <PrimaryButton label="Back to Dashboard" onClick={onBack} />
          </Spacings.Inline>
        </div>

        {isLoading ? (
          <div className={styles.loadingContainer}>
            <LoadingSpinner scale="l" />
            <Text.Body>Loading customers...</Text.Body>
          </div>
        ) : error ? (
          <ErrorMessage>Error loading customers: {error.message}</ErrorMessage>
        ) : enhancedCustomers.length === 0 ? (
          <div className={styles.emptyState}>
            <Text.Headline as="h2">No customers found</Text.Headline>
            <Text.Body>
              There are no customers associated with this store.
            </Text.Body>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <DataTable
              columns={columns}
              rows={enhancedCustomers}
              onRowClick={handleRowClick}
              onSortChange={tableSorting.onChange}
              sortDirection={tableSorting.value?.order}
              sortedBy={tableSorting.value?.key}
              maxHeight="80vh"
              maxWidth="100%"
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

export default Customers;
