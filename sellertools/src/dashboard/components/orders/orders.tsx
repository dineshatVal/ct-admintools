import React, { useEffect, useState, useMemo, useCallback } from 'react';
import DataTable from '@commercetools-uikit/data-table';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import Text from '@commercetools-uikit/text';
import Spacings from '@commercetools-uikit/spacings';
import PrimaryButton from '@commercetools-uikit/primary-button';
import SecondaryButton from '@commercetools-uikit/secondary-button';
import { RefreshIcon } from '@commercetools-uikit/icons';
import { ErrorMessage } from '@commercetools-uikit/messages';
import SelectField from '@commercetools-uikit/select-field';
import { ContentNotification } from '@commercetools-uikit/notifications';
import useOrders from '../../hooks/use-orders/use-orders';
import styles from './orders.module.css';
import { useHistory } from 'react-router-dom';
import { formatPrice } from '../../../utils/price';
import { useAuthContext } from '../../contexts/auth-context';
import { usePaginationState } from '@commercetools-uikit/hooks';
import { useDataTableSortingState } from '@commercetools-uikit/hooks';
import { Pagination } from '@commercetools-uikit/pagination';
interface OrdersProps {
  onBack: () => void;
  linkToWelcome: string;
}

const ORDER_STATES = [
  { value: 'Open', label: 'Open' },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Complete', label: 'Complete' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const Orders: React.FC<OrdersProps> = ({ onBack, linkToWelcome }) => {
  const { push } = useHistory();
  const { storeKey } = useAuthContext();
  const { page, perPage } = usePaginationState();
  const tableSorting = useDataTableSortingState();
  const {
    fetchOrdersByStore,
    updateOrderState,
    transitionOrderState,
    fetchOrderStates,
    orders,
    orderStates,
    loading,
    error,
    total,
  } = useOrders({ page, perPage, tableSorting });

  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState<string | null>(
    null
  );
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(
    null
  );
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [updatingOrderIds, setUpdatingOrderIds] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    // Load order states on component mount
    fetchOrderStates();
  }, [fetchOrderStates]);

  useEffect(() => {
    if (storeKey) {
      console.log(`Loading orders for store: ${storeKey}`);
      fetchOrdersByStore(storeKey).then(() => {
        setLastRefreshed(new Date().toLocaleString());
      });
      setIsFirstLoad(false);
    } else {
      console.warn('No store key provided, cannot load orders');
    }
  }, [storeKey, fetchOrdersByStore]);

  // Clear status messages after 5 seconds
  useEffect(() => {
    if (statusUpdateSuccess || statusUpdateError) {
      const timer = setTimeout(() => {
        setStatusUpdateSuccess(null);
        setStatusUpdateError(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [statusUpdateSuccess, statusUpdateError]);

  const handleRowClick = (row: any) => {
    // Skip handling if we don't have the raw data
    if (!row || !row.rawData) {
      return;
    }

    push(`${linkToWelcome}/orders/${row.rawData.id}`);
  };

  // Modified handle functions to show loading state - memoized with useCallback
  const handleStatusChange = useCallback(
    async (event: any, orderId: string, version: number) => {
      const newState = event.target.value;

      if (!newState) return;

      setStatusUpdateSuccess(null);
      setStatusUpdateError(null);

      // Set this specific order as updating
      setUpdatingOrderIds((prev) => ({ ...prev, [orderId]: true }));

      try {
        const result = await updateOrderState(orderId, version, newState);

        if (result) {
          setStatusUpdateSuccess(
            `Order ${orderId} status updated to ${newState}`
          );
        } else {
          setStatusUpdateError(`Failed to update order ${orderId} status`);
        }
      } catch (err) {
        setStatusUpdateError(
          `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      } finally {
        // Clear the updating state
        setUpdatingOrderIds((prev) => ({ ...prev, [orderId]: false }));
      }
    },
    [
      updateOrderState,
      setStatusUpdateSuccess,
      setStatusUpdateError,
      setUpdatingOrderIds,
    ]
  );

  const handleStateChange = useCallback(
    async (event: any, orderId: string, version: number) => {
      const newStateKey = event.target.value;

      if (!newStateKey) return;

      setStatusUpdateSuccess(null);
      setStatusUpdateError(null);

      // Set this specific order as updating
      setUpdatingOrderIds((prev) => ({ ...prev, [orderId]: true }));

      try {
        const result = await transitionOrderState(
          orderId,
          version,
          newStateKey
        );

        if (result) {
          const stateName =
            orderStates.find((state) => state.key === newStateKey)?.name ||
            newStateKey;
          setStatusUpdateSuccess(
            `Order ${orderId} state updated to ${stateName}`
          );
        } else {
          setStatusUpdateError(`Failed to update order ${orderId} state`);
        }
      } catch (err) {
        setStatusUpdateError(
          `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      } finally {
        // Clear the updating state
        setUpdatingOrderIds((prev) => ({ ...prev, [orderId]: false }));
      }
    },
    [
      transitionOrderState,
      orderStates,
      setStatusUpdateSuccess,
      setStatusUpdateError,
      setUpdatingOrderIds,
    ]
  );

  const handleRefreshOrders = useCallback(() => {
    if (storeKey) {
      console.log(`Manually refreshing orders for store: ${storeKey}`);
      fetchOrdersByStore(storeKey).then(() => {
        setLastRefreshed(new Date().toLocaleString());
      });
    }
  }, [storeKey, fetchOrdersByStore, setLastRefreshed]);

  // Map order states to select options - memoized
  const orderStateOptions = useMemo(
    () =>
      orderStates.map((state) => ({
        value: state.key,
        label: state.name,
      })),
    [orderStates]
  );

  // Define columns for the table - memoized
  const columns = useMemo(
    () => [
      { key: 'createdAt', label: 'Date', isSortable: true },
      { key: 'orderNumber', label: 'Order Number', isSortable: true },
      { key: 'customerName', label: 'Customer' },
      { key: 'total', label: 'Total' },
      {
        key: 'state',
        label: 'State',
        renderItem: (row: any) => {
          const handleStateClick = (e: React.MouseEvent) => {
            // Stop the click from propagating to the row
            e.stopPropagation();
          };

          const isUpdating = updatingOrderIds[row.id] === true;

          return (
            <div
              onClick={handleStateClick}
              className={isUpdating ? styles.selectLoading : undefined}
            >
              <SelectField
                title=""
                name={`state-${row.id}`}
                value={row.stateKey || ''}
                options={orderStateOptions}
                onChange={(event) =>
                  handleStateChange(event, row.rawData.id, row.rawData.version)
                }
                data-testid={`state-selector-${row.id}`}
                horizontalConstraint="scale"
                isDisabled={orderStateOptions.length === 0 || isUpdating}
                hasWarning={isUpdating}
              />
            </div>
          );
        },
      },
      {
        key: 'status',
        label: 'Status',
        renderItem: (row: any) => {
          const handleStatusClick = (e: React.MouseEvent) => {
            // Stop the click from propagating to the row
            e.stopPropagation();
          };

          const isUpdating = updatingOrderIds[row.id] === true;

          return (
            <div
              onClick={handleStatusClick}
              className={isUpdating ? styles.selectLoading : undefined}
            >
              <SelectField
                title=""
                name={`status-${row.id}`}
                value={row.status}
                options={ORDER_STATES}
                onChange={(event) =>
                  handleStatusChange(event, row.rawData.id, row.rawData.version)
                }
                data-testid={`status-selector-${row.id}`}
                horizontalConstraint="scale"
                isDisabled={isUpdating}
                hasWarning={isUpdating}
              />
            </div>
          );
        },
      },
    ],
    [orderStateOptions, updatingOrderIds, handleStateChange, handleStatusChange]
  );

  // Map orders to simple row format - memoized
  const rows = useMemo(
    () =>
      orders
        .filter((order) => {
          // Double-check that the order belongs to this store
          // This is a safety measure in case the API returns orders from other stores
          return true; // The filtering should be handled by the API query
        })
        .map((order) => ({
          id: order.id,
          createdAt: order.createdAt,
          orderNumber: order.orderNumber || 'N/A',
          customerName:
            order.customer?.firstName + ' ' + order.customer?.lastName ||
            order.customerEmail ||
            'Unknown',
          total: formatPrice(
            order.totalPrice.centAmount,
            order.totalPrice.currencyCode
          ),
          stateName: order.state?.name || 'Not set',
          stateKey: order.state?.key || '',
          status: order.orderState,
          rawData: order,
        })),
    [orders]
  );

  return (
    <div className={styles.ordersContainer}>
      <Spacings.Stack scale="l">
        <div className={styles.header}>
          <div>
            <Text.Headline as="h1">Orders</Text.Headline>
            <Text.Subheadline as="h4">
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
              onClick={handleRefreshOrders}
              isDisabled={loading}
            />
            <PrimaryButton label="Back to Dashboard" onClick={onBack} />
          </Spacings.Inline>
        </div>

        {statusUpdateSuccess && (
          <ContentNotification type="success">
            <Text.Body>{statusUpdateSuccess}</Text.Body>
          </ContentNotification>
        )}

        {statusUpdateError && (
          <ContentNotification type="error">
            <Text.Body>{statusUpdateError}</Text.Body>
          </ContentNotification>
        )}

        {loading && isFirstLoad ? (
          <div className={styles.loadingContainer}>
            <LoadingSpinner scale="l" />
            <Text.Body>Loading orders...</Text.Body>
          </div>
        ) : error ? (
          <ErrorMessage>Error loading orders: {error.message}</ErrorMessage>
        ) : orders.length === 0 ? (
          <div className={styles.emptyState}>
            <Text.Headline as="h2">No orders found</Text.Headline>
            <Text.Body>There are no orders available for this store.</Text.Body>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <DataTable
              columns={columns}
              rows={rows}
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

export default Orders;
