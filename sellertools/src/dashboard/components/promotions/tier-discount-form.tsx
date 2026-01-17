import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import Card from '@commercetools-uikit/card';
import TextField from '@commercetools-uikit/text-field';
import SelectField from '@commercetools-uikit/select-field';
import TextInput from '@commercetools-uikit/text-input';
import NumberInput from '@commercetools-uikit/number-input';
import PrimaryButton from '@commercetools-uikit/primary-button';
import SecondaryButton from '@commercetools-uikit/secondary-button';
import { BackIcon } from '@commercetools-uikit/icons';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import { ContentNotification } from '@commercetools-uikit/notifications';
import usePromotions from '../../hooks/use-promotions/use-promotions';
import messages from './messages';
import styles from './tier-discount-form.module.css';

interface TierDiscountFormProps {
  channelKey: string;
  onBack: () => void;
  onSubmit: (data: TierDiscountData) => void;
}

interface TierDiscountData {
  name: string;
  description: string;
  isActive: boolean;
  conditions: {
    variantSku: {
      value: string;
      operator: string;
    };
    quantity: {
      value: number;
      operator: string;
    };
  };
  discountValue: number;
  discountType: 'percentage' | 'absolute';
  sortOrder: string;
}

const TierDiscountForm: React.FC<TierDiscountFormProps> = ({
  channelKey,
  onBack,
  onSubmit,
}) => {
  const intl = useIntl();
  const { createProductDiscount, loading, error } = usePromotions();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const [discountData, setDiscountData] = useState<TierDiscountData>({
    name: '',
    description: '',
    isActive: true,
    conditions: {
      variantSku: {
        value: '',
        operator: 'is',
      },
      quantity: {
        value: 1,
        operator: 'is',
      },
    },
    discountValue: 10,
    discountType: 'percentage',
    sortOrder: '0.5',
  });

  const quantityOperatorOptions = [
    { value: 'is', label: intl.formatMessage(messages.operatorIs) },
    { value: 'isNot', label: intl.formatMessage(messages.operatorIsNot) },
    {
      value: 'lessThanOrEqual',
      label: intl.formatMessage(messages.operatorLessThanOrEqual),
    },
    {
      value: 'greaterThan',
      label: intl.formatMessage(messages.operatorGreaterThan),
    },
    {
      value: 'greaterThanOrEqual',
      label: intl.formatMessage(messages.operatorGreaterThanOrEqual),
    },
  ];

  const discountTypeOptions = [
    {
      value: 'percentage',
      label: intl.formatMessage(messages.discountTypePercentage),
    },
    {
      value: 'absolute',
      label: intl.formatMessage(messages.discountTypeAbsolute),
    },
  ];

  const handleInputChange = (
    field: string,
    value: string | number | boolean
  ) => {
    // Special validation for sort order
    if (field === 'sortOrder') {
      const strValue = String(value);
      const numValue = parseFloat(strValue);
      // Ensure it's a valid number less than 1
      if (!isNaN(numValue) && numValue < 1) {
        setDiscountData({
          ...discountData,
          [field]: strValue,
        });
      }
      // If not valid, don't update the state
      return;
    }

    // For other fields, update normally
    setDiscountData({
      ...discountData,
      [field]: value,
    });
  };

  const handleConditionChange = (
    conditionType: 'variantSku' | 'quantity',
    field: 'value' | 'operator',
    value: string | number
  ) => {
    setDiscountData({
      ...discountData,
      conditions: {
        ...discountData.conditions,
        [conditionType]: {
          ...discountData.conditions[conditionType],
          [field]: value,
        },
      },
    });
  };

  const buildProductPredicate = (): string => {
    // Build the product predicate string based on the current conditions
    const { variantSku, quantity } = discountData.conditions;

    // Handle variant SKU condition
    const skuPredicate = `sku = "${variantSku.value}"`;

    // Include the channel key condition
    const channelPredicate = `channel.key = "${channelKey}"`;

    return `${skuPredicate} and ${channelPredicate}`;
  };

  const handleSubmit = async () => {
    setSuccessMessage(null);
    setSubmissionError(null);

    try {
      // Create the product predicate from our conditions
      const predicate = buildProductPredicate();

      // Get the currency code for absolute discounts (using USD as default)
      const currencyCode =
        discountData.discountType === 'absolute' ? 'USD' : undefined;

      // Prepare the input for the mutation
      const input = {
        name: discountData.name,
        description: discountData.description,
        channelKey: channelKey,
        predicate,
        discountValue:
          discountData.discountType === 'percentage'
            ? discountData.discountValue
            : discountData.discountValue * 100, // Convert dollars to cents for absolute discounts
        discountType: discountData.discountType,
        currencyCode,
        isActive: discountData.isActive,
        sortOrder: discountData.sortOrder,
      };

      // Call the mutation
      const result = await createProductDiscount(input);

      if (result) {
        // Show success message
        setSuccessMessage(
          intl.formatMessage(messages.promotionCreateSuccess, {
            name: discountData.name,
          })
        );

        // Immediately call the onSubmit callback to refresh the promotions list
        onSubmit(discountData);

        // Navigate back after a delay
        setTimeout(() => {
          onBack();
        }, 2000);
      } else {
        setSubmissionError(intl.formatMessage(messages.promotionCreateError));
      }
    } catch (err) {
      console.error('Error submitting promotion:', err);
      setSubmissionError(
        err instanceof Error
          ? err.message
          : intl.formatMessage(messages.promotionCreateError)
      );
    }
  };

  const handleQuantityOperatorChange = (event: any) => {
    // Safely handle the SelectField onChange event
    const value = event.target.value;
    if (typeof value === 'string') {
      handleConditionChange('quantity', 'operator', value);
    }
  };

  const handleDiscountTypeChange = (event: any) => {
    // Safely handle the SelectField onChange event
    const value = event.target.value;
    if (
      typeof value === 'string' &&
      (value === 'percentage' || value === 'absolute')
    ) {
      handleInputChange('discountType', value as 'percentage' | 'absolute');
    }
  };

  return (
    <div className={styles.container}>
      <Spacings.Stack scale="l">
        <Spacings.Inline alignItems="center">
          <SecondaryButton
            label={intl.formatMessage(messages.backButton)}
            onClick={onBack}
            iconLeft={<BackIcon />}
          />
        </Spacings.Inline>

        <Text.Headline as="h2">
          {intl.formatMessage(messages.createTierDiscount)}
        </Text.Headline>

        {successMessage && (
          <ContentNotification type="success">
            <Text.Body>{successMessage}</Text.Body>
          </ContentNotification>
        )}

        {submissionError && (
          <ContentNotification type="error">
            <Text.Body>{submissionError}</Text.Body>
          </ContentNotification>
        )}

        <Card>
          <Spacings.Stack scale="m">
            <div className={styles.sectionTitle}>
              <Text.Subheadline as="h4">
                {intl.formatMessage(messages.basicInformation)}
              </Text.Subheadline>
            </div>

            <div className={styles.fieldGroup}>
              <TextField
                title={intl.formatMessage(messages.promotionName)}
                value={discountData.name}
                onChange={(event) =>
                  handleInputChange('name', event.target.value)
                }
                isRequired
              />

              <TextField
                title={intl.formatMessage(messages.promotionDescription)}
                value={discountData.description}
                onChange={(event) =>
                  handleInputChange('description', event.target.value)
                }
              />

              <div className={styles.sortOrderField}>
                <TextField
                  title={intl.formatMessage(messages.sortOrder)}
                  value={discountData.sortOrder}
                  onChange={(event) =>
                    handleInputChange('sortOrder', event.target.value)
                  }
                  isRequired
                  hint={intl.formatMessage(messages.sortOrderHint)}
                  errors={
                    discountData.sortOrder &&
                    (isNaN(parseFloat(discountData.sortOrder)) ||
                      parseFloat(discountData.sortOrder) >= 1)
                      ? { invalid: true }
                      : {}
                  }
                  renderError={() =>
                    intl.formatMessage(messages.sortOrderError)
                  }
                />
              </div>
            </div>
          </Spacings.Stack>
        </Card>

        <Card>
          <Spacings.Stack scale="m">
            <div className={styles.sectionTitle}>
              <Text.Subheadline as="h4">
                {intl.formatMessage(messages.conditions)}
              </Text.Subheadline>
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.conditionRow}>
                <div className={styles.labelContainer}>
                  <Text.Body fontWeight="bold" tone="inverted">
                    {intl.formatMessage(messages.variantSku)}
                  </Text.Body>
                </div>
                <div className={styles.conditionForm}>
                  <div className={styles.operatorText}>
                    <Text.Body>
                      {intl.formatMessage(messages.operatorIs)}
                    </Text.Body>
                  </div>
                  <div className={styles.valueInput}>
                    <TextInput
                      value={discountData.conditions.variantSku.value}
                      onChange={(event) =>
                        handleConditionChange(
                          'variantSku',
                          'value',
                          event.target.value
                        )
                      }
                      placeholder={intl.formatMessage(messages.enterSku)}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.conditionRow}>
                <div className={styles.labelContainer}>
                  <Text.Body fontWeight="bold" tone="inverted">
                    {intl.formatMessage(messages.quantity)}
                  </Text.Body>
                </div>
                <div className={styles.conditionForm}>
                  <div className={styles.operatorSelect}>
                    <SelectField
                      title=""
                      value={discountData.conditions.quantity.operator}
                      onChange={handleQuantityOperatorChange}
                      options={quantityOperatorOptions}
                      horizontalConstraint="auto"
                    />
                  </div>
                  <div className={styles.valueInput}>
                    <NumberInput
                      value={discountData.conditions.quantity.value}
                      onChange={(event) =>
                        handleConditionChange(
                          'quantity',
                          'value',
                          event.target.valueAsNumber || 1
                        )
                      }
                      min={1}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Spacings.Stack>
        </Card>

        <Card>
          <Spacings.Stack scale="m">
            <div className={styles.sectionTitle}>
              <Text.Subheadline as="h4">
                {intl.formatMessage(messages.discountValue)}
              </Text.Subheadline>
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.discountFormRow}>
                <div>
                  <SelectField
                    title=""
                    value={discountData.discountType}
                    onChange={handleDiscountTypeChange}
                    options={discountTypeOptions}
                  />
                </div>

                <div className={styles.discountValueContainer}>
                  <div className={styles.valueInput}>
                    <NumberInput
                      value={discountData.discountValue}
                      onChange={(event) =>
                        handleInputChange(
                          'discountValue',
                          event.target.valueAsNumber || 0
                        )
                      }
                      min={0}
                      max={
                        discountData.discountType === 'percentage'
                          ? 100
                          : undefined
                      }
                      step={
                        discountData.discountType === 'percentage' ? 1 : 0.01
                      }
                      placeholder={
                        discountData.discountType === 'percentage'
                          ? '10'
                          : '10.99'
                      }
                      horizontalConstraint="scale"
                    />
                  </div>

                  {discountData.discountType === 'percentage' && (
                    <div className={styles.percentSymbol}>
                      <Text.Body>%</Text.Body>
                    </div>
                  )}

                  {discountData.discountType === 'absolute' && (
                    <div className={styles.currencySymbol}>
                      <Text.Body>$</Text.Body>
                    </div>
                  )}
                </div>
              </div>

              <Text.Detail>
                {intl.formatMessage(
                  discountData.discountType === 'percentage'
                    ? messages.percentageDiscountDescription
                    : messages.absoluteDiscountDescription
                )}
                <br />
                {intl.formatMessage(
                  discountData.discountType === 'percentage'
                    ? messages.percentageDiscountHint
                    : messages.absoluteDiscountHint
                )}
              </Text.Detail>
            </div>
          </Spacings.Stack>
        </Card>

        <Spacings.Inline justifyContent="flex-end">
          <SecondaryButton
            label={intl.formatMessage(messages.cancel)}
            onClick={onBack}
            isDisabled={loading}
          />

          <PrimaryButton
            label={intl.formatMessage(messages.createPromotion)}
            onClick={handleSubmit}
            isDisabled={
              !discountData.name ||
              !discountData.conditions.variantSku.value ||
              !discountData.sortOrder ||
              isNaN(parseFloat(discountData.sortOrder)) ||
              parseFloat(discountData.sortOrder) >= 1 ||
              loading
            }
          />
        </Spacings.Inline>

        {loading && (
          <div className={styles.loadingOverlay}>
            <LoadingSpinner scale="l" />
          </div>
        )}
      </Spacings.Stack>
    </div>
  );
};

export default TierDiscountForm;
