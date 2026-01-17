import { ConfirmationDialog } from '@commercetools-frontend/application-components';
import Checkbox from '@commercetools-uikit/checkbox-input';
import DataTable, { TColumn } from '@commercetools-uikit/data-table';
import { PlusBoldIcon, RefreshIcon } from '@commercetools-uikit/icons';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import { ErrorMessage } from '@commercetools-uikit/messages';
import { ContentNotification } from '@commercetools-uikit/notifications';
import PrimaryButton from '@commercetools-uikit/primary-button';
import SecondaryButton from '@commercetools-uikit/secondary-button';
import SelectField from '@commercetools-uikit/select-field';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useAuthContext } from '../../contexts/auth-context';
import usePromotions from '../../hooks/use-promotions/use-promotions';
import messages from './messages';
import styles from './promotions.module.css';
import { useHistory } from 'react-router';

interface PromotionsProps {
  linkToWelcome: string;
  onBack: () => void;
}

// Type for the promotion discount data
interface PromotionData {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  predicate: string;
  channelKey: string | null;
  valueAmount: string;
  sortOrder: string;
  version: number;
  key: string | null;
}

// Type for the current view state
type ViewState = 'list' | 'add-product-discount' | 'edit-product-discount';

// Type for bulk actions
type BulkAction = 'activate' | 'deactivate' | 'delete' | '';

const Promotions: React.FC<PromotionsProps> = ({ linkToWelcome, onBack }) => {
  // TODO: Get the distribution channel key from the auth context
  const { storeKey: channelKey } = useAuthContext();
  const intl = useIntl();
  const { push } = useHistory();
  const [promotions, setPromotions] = useState<PromotionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [selectedPromotion, setSelectedPromotion] =
    useState<PromotionData | null>(null);

  // Multi-select and bulk action states
  const [selectedPromotionIds, setSelectedPromotionIds] = useState<string[]>(
    []
  );
  const [bulkAction, setBulkAction] = useState<BulkAction>('');
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [bulkActionInProgress, setBulkActionInProgress] = useState(false);
  const [bulkActionError, setBulkActionError] = useState<string | null>(null);
  const [bulkActionSuccess, setBulkActionSuccess] = useState<string | null>(
    null
  );

  const {
    fetchPromotions,
    updatePromotionActiveStatus,
    deleteProductDiscount,
  } = usePromotions();

  const loadPromotions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`Fetching product discounts for channel: ${channelKey}`);
      const result = await fetchPromotions(channelKey!);

      if (result && result.length > 0) {
        console.log(
          `Fetched ${result.length} product discounts for channel ${channelKey}`
        );
        setPromotions(result);
      } else {
        console.log(`No product discounts found for channel ${channelKey}`);
        setPromotions([]);
      }

      // Update last refreshed timestamp
      setLastRefreshed(new Date().toLocaleString());
    } catch (err) {
      console.error(
        `Error fetching product discounts for channel ${channelKey}:`,
        err
      );
      setError(
        err instanceof Error
          ? err
          : new Error('Unknown error fetching product discounts')
      );
    } finally {
      setIsLoading(false);
    }
  }, [channelKey, fetchPromotions]);

  useEffect(() => {
    loadPromotions();
  }, [loadPromotions]);

  // Format currency amount for display
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount / 100); // Convert cent amount to dollars
  };

  // Format percentage for display
  const formatPercentage = (permyriad: number) => {
    return `${(permyriad / 100).toFixed(2)}%`; // Convert permyriad to percentage
  };

  // Handle promotion row click to open edit form
  const handleRowClick = (promotion: PromotionData) => {
    push(`${linkToWelcome}/promotions/${promotion.id}`);
  };

  // Handle checkbox selection
  const handleSelectPromotion = (id: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedPromotionIds((prev) => [...prev, id]);
    } else {
      setSelectedPromotionIds((prev) =>
        prev.filter((promotionId) => promotionId !== id)
      );
    }
  };

  // Handle select all checkbox
  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      const allIds = promotions.map((promotion) => promotion.id);
      setSelectedPromotionIds(allIds);
    } else {
      setSelectedPromotionIds([]);
    }
  };

  // Handle bulk action change
  const handleBulkActionChange = (event: any) => {
    // Safely handle the SelectField onChange event
    if (event && event.target && typeof event.target.value === 'string') {
      const action = event.target.value as BulkAction;
      setBulkAction(action);

      if (action) {
        setIsConfirmationOpen(true);
      }
    }
  };

  // Execute bulk action after confirmation
  const executeBulkAction = async () => {
    if (!bulkAction || selectedPromotionIds.length === 0) {
      return;
    }

    setBulkActionInProgress(true);
    setBulkActionError(null);
    setBulkActionSuccess(null);

    try {
      const selectedPromotions = promotions.filter((p) =>
        selectedPromotionIds.includes(p.id)
      );

      if (bulkAction === 'activate' || bulkAction === 'deactivate') {
        const targetActiveState = bulkAction === 'activate';

        // Only process promotions that need to change state
        const promotionsToUpdate = selectedPromotions.filter(
          (p) => p.isActive !== targetActiveState
        );

        if (promotionsToUpdate.length === 0) {
          setBulkActionSuccess(
            intl.formatMessage(
              bulkAction === 'activate'
                ? messages.bulkActivateNoChanges
                : messages.bulkDeactivateNoChanges
            )
          );
          setBulkActionInProgress(false);
          setIsConfirmationOpen(false);
          setBulkAction('');
          return;
        }

        // Track successes and failures
        let successCount = 0;
        let failureCount = 0;

        // Process each promotion sequentially
        for (const promotion of promotionsToUpdate) {
          try {
            const result = await updatePromotionActiveStatus({
              id: promotion.id,
              version: Number(promotion.version),
              isActive: targetActiveState,
            });

            if (result) {
              successCount++;
            } else {
              failureCount++;
            }
          } catch (err) {
            console.error(`Error updating promotion ${promotion.id}:`, err);
            failureCount++;
          }
        }

        // Set success message
        if (successCount > 0) {
          setBulkActionSuccess(
            intl.formatMessage(
              bulkAction === 'activate'
                ? messages.bulkActivateSuccess
                : messages.bulkDeactivateSuccess,
              { count: successCount }
            )
          );
        }

        // Set error message if some failed
        if (failureCount > 0) {
          setBulkActionError(
            intl.formatMessage(
              bulkAction === 'activate'
                ? messages.bulkActivatePartialError
                : messages.bulkDeactivatePartialError,
              { count: failureCount }
            )
          );
        }

        // Refresh the promotions list
        await loadPromotions();
      } else if (bulkAction === 'delete') {
        // Track successes and failures
        let successCount = 0;
        let failureCount = 0;

        // Process each promotion sequentially
        for (const promotion of selectedPromotions) {
          try {
            const result = await deleteProductDiscount({
              id: promotion.id,
              version: Number(promotion.version),
            });

            if (result) {
              successCount++;
            } else {
              failureCount++;
            }
          } catch (err) {
            console.error(`Error deleting promotion ${promotion.id}:`, err);
            failureCount++;
          }
        }

        // Set success message
        if (successCount > 0) {
          setBulkActionSuccess(
            intl.formatMessage(messages.bulkDeleteSuccess, {
              count: successCount,
            })
          );
        }

        // Set error message if some failed
        if (failureCount > 0) {
          setBulkActionError(
            intl.formatMessage(messages.bulkDeletePartialError, {
              count: failureCount,
            })
          );
        }

        // Refresh the promotions list
        await loadPromotions();
      }
    } catch (err) {
      console.error('Error executing bulk action:', err);
      setBulkActionError(intl.formatMessage(messages.bulkActionError));
    } finally {
      setBulkActionInProgress(false);
      setIsConfirmationOpen(false);
      setBulkAction('');
      // Clear selection after action
      setSelectedPromotionIds([]);
    }
  };

  // Define the column structure for the DataTable
  const columns: TColumn<PromotionData>[] = [
    {
      key: 'selection',
      label: (
        <Checkbox
          isChecked={
            selectedPromotionIds.length > 0 &&
            selectedPromotionIds.length === promotions.length
          }
          isIndeterminate={
            selectedPromotionIds.length > 0 &&
            selectedPromotionIds.length < promotions.length
          }
          onChange={(event) => handleSelectAll(event.target.checked)}
        />
      ),
      renderItem: (row: PromotionData): ReactNode => (
        <div onClick={(event) => event.stopPropagation()}>
          <Checkbox
            isChecked={selectedPromotionIds.includes(row.id)}
            onChange={(event) =>
              handleSelectPromotion(row.id, event.target.checked)
            }
          />
        </div>
      ),
    },
    { key: 'name', label: intl.formatMessage(messages.columnName) },
    {
      key: 'statusDisplay',
      label: intl.formatMessage(messages.columnStatus),
      renderItem: (row: PromotionData): ReactNode => (
        <div
          className={row.isActive ? styles.statusActive : styles.statusInactive}
        >
          {row.isActive
            ? intl.formatMessage(messages.statusActive)
            : intl.formatMessage(messages.statusInactive)}
        </div>
      ),
    },
    {
      key: 'description',
      label: intl.formatMessage(messages.columnDescription),
    },
    { key: 'predicate', label: intl.formatMessage(messages.columnPredicate) },
    {
      key: 'valueAmount',
      label: intl.formatMessage(messages.columnValueAmount),
    },
  ];

  const handleAddPromotion = () => {
    push(`${linkToWelcome}/promotions/add`);
  };

  // Handle manual refresh button click
  const handleRefresh = () => {
    if (!isLoading) {
      loadPromotions();
    }
  };

  // Render the bulk action controls
  const renderBulkActionControls = () => {
    return (
      <Spacings.Inline alignItems="center" scale="s">
        <SelectField
          horizontalConstraint="auto"
          value={bulkAction}
          onChange={handleBulkActionChange}
          title="Actions"
          options={[
            {
              value: 'activate',
              label: intl.formatMessage(messages.bulkActionActivate),
            },
            {
              value: 'deactivate',
              label: intl.formatMessage(messages.bulkActionDeactivate),
            },
            {
              value: 'delete',
              label: intl.formatMessage(messages.bulkActionDelete),
            },
          ]}
          isDisabled={selectedPromotionIds.length === 0}
        />
      </Spacings.Inline>
    );
  };

  return (
    <div className={styles.container}>
      <Spacings.Stack scale="l">
        <div className={styles.header}>
          <div>
            <Text.Headline as="h1">
              {intl.formatMessage(messages.title)}
            </Text.Headline>
            <Text.Subheadline>
              Channel:{' '}
              <span className={styles.storeKeyHighlight}>{channelKey}</span>
            </Text.Subheadline>
            {lastRefreshed && (
              <Text.Detail tone="secondary">
                Last refreshed: {lastRefreshed}
              </Text.Detail>
            )}
            <div className={styles.actionButtonContainer}>
              <PrimaryButton
                label={intl.formatMessage(messages.addPromotion)}
                onClick={handleAddPromotion}
                iconLeft={<PlusBoldIcon />}
              />
            </div>
          </div>
          <Spacings.Inline scale="s">
            <SecondaryButton
              iconLeft={<RefreshIcon />}
              label={intl.formatMessage(messages.refreshButton)}
              onClick={handleRefresh}
              isDisabled={isLoading || bulkActionInProgress}
            />
            <PrimaryButton
              label={intl.formatMessage(messages.backButton)}
              onClick={onBack}
            />
          </Spacings.Inline>
        </div>

        {renderBulkActionControls()}

        {bulkActionSuccess && (
          <ContentNotification type="success">
            <Text.Body>{bulkActionSuccess}</Text.Body>
          </ContentNotification>
        )}

        {bulkActionError && (
          <ContentNotification type="error">
            <Text.Body>{bulkActionError}</Text.Body>
          </ContentNotification>
        )}

        {isLoading || bulkActionInProgress ? (
          <div className={styles.loadingContainer}>
            <LoadingSpinner scale="l" />
            <Text.Body>
              {bulkActionInProgress
                ? intl.formatMessage(messages.bulkActionInProgress)
                : intl.formatMessage(messages.loadingPromotions)}
            </Text.Body>
          </div>
        ) : error ? (
          <ErrorMessage>
            {intl.formatMessage(messages.errorFetchingPromotions, {
              error: error.message,
            })}
          </ErrorMessage>
        ) : promotions.length === 0 ? (
          <Text.Body>
            {intl.formatMessage(messages.noPromotionsFound)}
          </Text.Body>
        ) : (
          <div className={styles.tableContainer}>
            <DataTable<PromotionData>
              columns={columns}
              rows={promotions}
              maxHeight={600}
              onRowClick={handleRowClick}
            />
          </div>
        )}

        {isConfirmationOpen && (
          <ConfirmationDialog
            title={intl.formatMessage(
              bulkAction === 'activate'
                ? messages.bulkActivateConfirmTitle
                : bulkAction === 'deactivate'
                ? messages.bulkDeactivateConfirmTitle
                : messages.bulkDeleteConfirmTitle
            )}
            isOpen={isConfirmationOpen}
            onClose={() => {
              setIsConfirmationOpen(false);
              setBulkAction('');
            }}
            onCancel={() => {
              setIsConfirmationOpen(false);
              setBulkAction('');
            }}
            onConfirm={executeBulkAction}
          >
            <Text.Body>
              {intl.formatMessage(
                bulkAction === 'activate'
                  ? messages.bulkActivateConfirmMessage
                  : bulkAction === 'deactivate'
                  ? messages.bulkDeactivateConfirmMessage
                  : messages.bulkDeleteConfirmMessage,
                { count: selectedPromotionIds.length }
              )}
            </Text.Body>
          </ConfirmationDialog>
        )}
      </Spacings.Stack>
    </div>
  );
};

export default Promotions;
