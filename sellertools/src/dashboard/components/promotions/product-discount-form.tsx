import React, { useState, useEffect } from 'react';
import { useIntl } from 'react-intl';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import Card from '@commercetools-uikit/card';
import TextField from '@commercetools-uikit/text-field';
import SelectField from '@commercetools-uikit/select-field';
import NumberInput from '@commercetools-uikit/number-input';
import PrimaryButton from '@commercetools-uikit/primary-button';
import SecondaryButton from '@commercetools-uikit/secondary-button';
import {
  BackIcon,
  PlusBoldIcon,
  BinLinearIcon,
} from '@commercetools-uikit/icons';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import { ContentNotification } from '@commercetools-uikit/notifications';
import usePromotions from '../../hooks/use-promotions/use-promotions';
import messages from './messages';
import styles from './tier-discount-form.module.css'; // Reusing the existing styles
import { useAuthContext } from '../../contexts/auth-context';
import { ProductDiscountData, Condition } from './product-discount-wrapper';

interface ProductDiscountFormProps {
  linkToWelcome: string;
  onBack: () => void;
  isEditing?: boolean;
  initialData: ProductDiscountData;
  onSubmit?: (data: ProductDiscountData) => void;
}

const ProductDiscountForm: React.FC<ProductDiscountFormProps> = ({
  onBack,
  linkToWelcome,
  isEditing = false,
  initialData,
  onSubmit,
}) => {
  const { storeKey: channelKey } = useAuthContext();
  const intl = useIntl();
  const { createProductDiscount, updateProductDiscount, loading, error } =
    usePromotions();
  const [discountData, setDiscountData] =
    useState<ProductDiscountData>(initialData);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Add additional state for current input value
  const [moneyInputValue, setMoneyInputValue] = useState<string>(
    discountData.discountType === 'absolute'
      ? discountData.discountValue.toFixed(2)
      : discountData.discountValue.toString()
  );

  // Only update money input when discount type changes, not when discountValue changes
  useEffect(() => {
    // Only update the display value when switching between percentage and absolute
    if (discountData?.discountType === 'absolute') {
      setMoneyInputValue(discountData.discountValue.toFixed(2));
    } else {
      setMoneyInputValue(discountData?.discountValue.toString() || '');
    }
  }, [discountData?.discountType]); // Remove discountData.discountValue dependency

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

  const conditionTypeOptions = [
    { value: 'sku', label: intl.formatMessage(messages.conditionTypeSku) },
    {
      value: 'category',
      label: intl.formatMessage(messages.conditionTypeCategory),
    },
  ];

  const operatorOptions = [
    { value: 'is', label: intl.formatMessage(messages.operatorIs) },
    { value: 'isNot', label: intl.formatMessage(messages.operatorIsNot) },
    { value: 'contains', label: intl.formatMessage(messages.operatorContains) },
    {
      value: 'doesNotContain',
      label: intl.formatMessage(messages.operatorDoesNotContain),
    },
    {
      value: 'isGreaterThan',
      label: intl.formatMessage(messages.operatorGreaterThan),
    },
    {
      value: 'isLessThan',
      label: intl.formatMessage(messages.operatorLessThan),
    },
  ];

  const handleInputChange = (
    field: string,
    value: string | number | boolean
  ) => {
    // For all fields, update normally
    setDiscountData({
      ...discountData,
      [field]: value,
    });
  };

  const handleApplyToChange = (event: any) => {
    const value = event.target.value as 'all' | 'specific';

    setDiscountData({
      ...discountData,
      applyTo: value,
      // Reset conditions if switching to "all products"
      conditions:
        value === 'all'
          ? []
          : discountData.conditions.length > 0
          ? discountData.conditions
          : [
              // Add default condition if switching to specific and no conditions exist
              {
                id: `condition-${Date.now()}`,
                type: 'sku',
                operator: 'is',
                value: '',
              },
            ],
    });
  };

  const addCondition = () => {
    const newCondition: Condition = {
      id: `condition-${Date.now()}`, // Generate a unique ID
      type: 'sku',
      operator: 'is',
      value: '',
    };

    setDiscountData({
      ...discountData,
      conditions: [...discountData.conditions, newCondition],
    });
  };

  const updateCondition = (
    conditionId: string,
    field: keyof Condition,
    value: string
  ) => {
    setDiscountData({
      ...discountData,
      conditions: discountData.conditions.map((condition) =>
        condition.id === conditionId
          ? { ...condition, [field]: value as any }
          : condition
      ),
    });
  };

  const removeCondition = (conditionId: string) => {
    setDiscountData({
      ...discountData,
      conditions: discountData.conditions.filter(
        (condition) => condition.id !== conditionId
      ),
    });
  };

  const buildProductPredicate = (): string => {
    // If applying to all products, only include the channel key
    if (discountData.applyTo === 'all') {
      return `channel.key = "${channelKey}"`;
    }

    // Build conditions for specific products
    const conditionStrings = discountData.conditions.map((condition) => {
      let attributeKey: string;
      let operator: string;

      // Map condition type to appropriate attribute
      switch (condition.type) {
        case 'sku':
          attributeKey = 'sku';
          break;
        case 'category':
          attributeKey = 'categories.key';
          break;
        default:
          attributeKey = 'sku';
      }

      // Map operator type to predicate operator
      switch (condition.operator) {
        case 'is':
          // Special handling for categories
          if (condition.type === 'category') {
            return `${attributeKey} contains "${condition.value}"`;
          }
          operator = '=';
          break;
        case 'isNot':
          // Special handling for categories
          if (condition.type === 'category') {
            return `not(${attributeKey} contains "${condition.value}")`;
          }
          operator = '!=';
          break;
        case 'contains':
          return `${attributeKey} contains "${condition.value}"`;
        case 'doesNotContain':
          return `not(${attributeKey} contains "${condition.value}")`;
        case 'isGreaterThan':
          operator = '>';
          break;
        case 'isLessThan':
          operator = '<';
          break;
        default:
          operator = '=';
      }

      return `${attributeKey} ${operator} "${condition.value}"`;
    });

    // Always include the channel key condition
    conditionStrings.push(`channel.key = "${channelKey}"`);

    // Join all conditions with AND
    return conditionStrings.join(' and ');
  };

  // Function to generate a random sort order value between 0 and 1
  const generateRandomSortOrder = (): string => {
    // Generate a random number between 0 and 1 (non-inclusive)
    let random = Math.random();

    // Convert to string with 6 decimals
    let result = random.toFixed(6);

    // Check if it ends with 0 and replace if needed
    while (result.endsWith('0')) {
      // Replace the last character with a random non-zero digit
      result = result.slice(0, -1) + (Math.floor(Math.random() * 9) + 1);
    }

    return result;
  };

  // Maximum number of retries for sort order conflicts
  const MAX_RETRIES = 5;

  const handleSubmit = async (retryCount = 0) => {
    setSuccessMessage(null);
    setSubmissionError(null);

    try {
      // Create the product predicate with conditions
      const predicate = buildProductPredicate();

      // Get the currency code for absolute discounts (using USD as default)
      const currencyCode =
        discountData.discountType === 'absolute' ? 'USD' : undefined;

      // Make sure we have a valid sort order (generate a new one if needed)
      const sortOrder =
        isNaN(parseFloat(discountData.sortOrder)) ||
        parseFloat(discountData.sortOrder) >= 1
          ? generateRandomSortOrder()
          : discountData.sortOrder;

      // Ensure channelKey is a string (not null)
      if (!channelKey) {
        throw new Error('Channel key is required for product discounts');
      }

      // Prepare the input for the mutation
      const baseInput = {
        name: discountData.name,
        description: discountData.description,
        channelKey,
        predicate,
        discountValue: discountData.discountValue,
        discountType: discountData.discountType,
        currencyCode,
        isActive: discountData.isActive,
        sortOrder,
      };

      // Log the value being sent
      console.log(
        `${isEditing ? 'Updating' : 'Creating'} product discount with value: ${
          discountData.discountValue
        } ${discountData.discountType === 'percentage' ? '%' : 'dollars'}`
      );
      console.log(
        `${isEditing ? 'Updating' : 'Creating'} product discount with input:`,
        isEditing
          ? {
              ...baseInput,
              id: discountData.id!,
              version: discountData.version!,
            }
          : baseInput
      );

      // Call the appropriate mutation based on isEditing
      let result;
      if (isEditing && discountData.id && discountData.version) {
        result = await updateProductDiscount({
          ...baseInput,
          id: discountData.id,
          version: discountData.version,
        });
      } else {
        result = await createProductDiscount(baseInput);
      }

      if (result) {
        // Show success message
        setSuccessMessage(
          intl.formatMessage(
            isEditing
              ? messages.promotionUpdateSuccess
              : messages.promotionCreateSuccess,
            { name: discountData.name }
          )
        );

        // Call the onSubmit callback with the updated data
        onSubmit?.(discountData);

        // Navigate back after a delay
        setTimeout(() => {
          onBack();
        }, 2000);
      } else {
        setSubmissionError(
          intl.formatMessage(
            isEditing
              ? messages.promotionUpdateError
              : messages.promotionCreateError
          )
        );
      }
    } catch (err) {
      console.error(
        `Error ${isEditing ? 'updating' : 'submitting'} product discount:`,
        err
      );

      // Check if the error is related to duplicate sort order
      const errorMessage = err instanceof Error ? err.message : '';
      const isSortOrderConflict =
        errorMessage.includes('sort order') ||
        errorMessage.includes('sortOrder') ||
        errorMessage.includes('duplicate');

      // If it's a sort order conflict and we haven't exceeded max retries, try again with a new sort order
      if (isSortOrderConflict && retryCount < MAX_RETRIES) {
        console.log(
          `Sort order conflict detected. Retrying with a new sort order (attempt ${
            retryCount + 1
          }/${MAX_RETRIES})...`
        );

        // Set a new random sort order
        const newSortOrder = generateRandomSortOrder();
        setDiscountData((prev) => ({
          ...prev,
          sortOrder: newSortOrder,
        }));

        // Wait a short time before retrying to ensure state updates
        setTimeout(() => {
          handleSubmit(retryCount + 1);
        }, 100);

        return;
      }

      // If it's not a sort order conflict or we've exceeded retries, show the error
      setSubmissionError(
        err instanceof Error
          ? err.message
          : intl.formatMessage(
              isEditing
                ? messages.promotionUpdateError
                : messages.promotionCreateError
            )
      );
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
          {intl.formatMessage(
            isEditing
              ? messages.editProductDiscount
              : messages.createProductDiscount
          )}
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
                hint={intl.formatMessage(messages.nameHint)}
              />

              <TextField
                title={intl.formatMessage(messages.promotionDescription)}
                value={discountData.description}
                onChange={(event) =>
                  handleInputChange('description', event.target.value)
                }
              />

              {/* Sort order field removed - auto-generated */}
            </div>
          </Spacings.Stack>
        </Card>

        <Card>
          <Spacings.Stack scale="m">
            <div className={styles.sectionTitle}>
              <Text.Subheadline as="h4">
                {intl.formatMessage(messages.productConditions)}
              </Text.Subheadline>
            </div>

            <div className={styles.fieldGroup}>
              <Spacings.Stack>
                <SelectField
                  title={intl.formatMessage(messages.applyTo)}
                  value={discountData.applyTo}
                  onChange={handleApplyToChange}
                  options={[
                    {
                      value: 'all',
                      label: intl.formatMessage(messages.applyToAll),
                    },
                    {
                      value: 'specific',
                      label: intl.formatMessage(messages.applyToSpecific),
                    },
                  ]}
                  horizontalConstraint="scale"
                />

                {discountData.applyTo === 'specific' && (
                  <Spacings.Stack scale="s">
                    <Text.Body>
                      {intl.formatMessage(messages.specificProductsDescription)}
                    </Text.Body>

                    <div className={styles.conditionsContainer}>
                      {discountData.conditions.map((condition, index) => (
                        <Spacings.Stack key={condition.id} scale="s">
                          <div className={styles.conditionRow}>
                            <div className={styles.conditionType}>
                              <SelectField
                                title={
                                  index === 0
                                    ? intl.formatMessage(messages.conditionType)
                                    : ''
                                }
                                value={condition.type}
                                onChange={(event) =>
                                  updateCondition(
                                    condition.id,
                                    'type',
                                    event.target.value as string
                                  )
                                }
                                options={conditionTypeOptions}
                                horizontalConstraint="scale"
                              />
                            </div>
                            <div className={styles.conditionOperator}>
                              <SelectField
                                title={
                                  index === 0
                                    ? intl.formatMessage(
                                        messages.conditionOperator
                                      )
                                    : ''
                                }
                                value={condition.operator}
                                onChange={(event) =>
                                  updateCondition(
                                    condition.id,
                                    'operator',
                                    event.target.value as string
                                  )
                                }
                                options={operatorOptions}
                                horizontalConstraint="scale"
                              />
                            </div>
                            <div className={styles.conditionValue}>
                              <TextField
                                title={
                                  index === 0
                                    ? intl.formatMessage(
                                        messages.conditionValue
                                      )
                                    : ''
                                }
                                value={condition.value}
                                onChange={(event) =>
                                  updateCondition(
                                    condition.id,
                                    'value',
                                    event.target.value
                                  )
                                }
                                horizontalConstraint="scale"
                                placeholder={
                                  condition.type === 'sku'
                                    ? intl.formatMessage(
                                        messages.skuPlaceholder
                                      )
                                    : intl.formatMessage(
                                        messages.categoryPlaceholder
                                      )
                                }
                              />
                            </div>
                            <div className={styles.conditionRemove}>
                              {discountData.conditions.length > 1 && (
                                <SecondaryButton
                                  label=""
                                  iconLeft={<BinLinearIcon />}
                                  onClick={() => removeCondition(condition.id)}
                                />
                              )}
                            </div>
                          </div>

                          {index < discountData.conditions.length - 1 && (
                            <div className={styles.conditionConnector}>
                              <Text.Body>AND</Text.Body>
                            </div>
                          )}
                        </Spacings.Stack>
                      ))}
                    </div>

                    <Spacings.Inline>
                      <SecondaryButton
                        label={intl.formatMessage(messages.addCondition)}
                        onClick={addCondition}
                        iconLeft={<PlusBoldIcon />}
                      />
                    </Spacings.Inline>

                    {discountData.conditions.length === 0 && (
                      <ContentNotification type="info">
                        <Text.Body>
                          {intl.formatMessage(messages.noConditionsWarning)}
                        </Text.Body>
                      </ContentNotification>
                    )}
                  </Spacings.Stack>
                )}
              </Spacings.Stack>
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
                    title={intl.formatMessage(messages.discountType)}
                    value={discountData.discountType}
                    onChange={handleDiscountTypeChange}
                    options={discountTypeOptions}
                    horizontalConstraint="scale"
                  />
                </div>

                <div className={styles.discountValueContainer}>
                  {discountData.discountType === 'percentage' ? (
                    <div className={styles.valueInput}>
                      <Spacings.Stack scale="xs">
                        <Text.Subheadline as="h4">
                          {intl.formatMessage(messages.discountPercentage)}
                        </Text.Subheadline>
                        <NumberInput
                          value={discountData.discountValue}
                          onChange={(event) =>
                            handleInputChange(
                              'discountValue',
                              event.target.valueAsNumber || 0
                            )
                          }
                          min={0}
                          max={100}
                          step={0.1}
                          horizontalConstraint="scale"
                        />
                      </Spacings.Stack>
                    </div>
                  ) : (
                    <div className={styles.valueInput}>
                      <Spacings.Stack scale="xs">
                        <Text.Subheadline as="h4">
                          {intl.formatMessage(messages.discountAbsolute)}
                        </Text.Subheadline>
                        <Spacings.Inline alignItems="center">
                          <Text.Body>$</Text.Body>
                          <div className={styles.customMoneyInput}>
                            <input
                              type="number"
                              value={moneyInputValue}
                              onChange={(event) => {
                                // Get the raw input value
                                const inputValue = event.target.value;

                                // Update the display value immediately
                                setMoneyInputValue(inputValue);

                                // Update the actual discount value
                                const numValue = parseFloat(inputValue);
                                if (!isNaN(numValue)) {
                                  handleInputChange('discountValue', numValue);
                                } else {
                                  handleInputChange('discountValue', 0);
                                }
                              }}
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              className={styles.moneyInputField}
                            />
                          </div>
                        </Spacings.Inline>
                      </Spacings.Stack>
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
              </Text.Detail>

              <Text.Detail tone="secondary">
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
            label={intl.formatMessage(
              isEditing ? messages.updatePromotion : messages.createPromotion
            )}
            onClick={() => handleSubmit(0)}
            isDisabled={
              !discountData.name ||
              (discountData.applyTo === 'specific' &&
                discountData.conditions.length === 0) ||
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

export default ProductDiscountForm;
