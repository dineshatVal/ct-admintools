import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import { ContentNotification } from '@commercetools-uikit/notifications';
import usePromotions, {
  PromotionData,
} from '../../hooks/use-promotions/use-promotions';
import ProductDiscountForm from './product-discount-form';
import { useAuthContext } from '../../contexts/auth-context';
import messages from './messages';

// Define the condition types that will be passed to the form
type ConditionType = 'sku' | 'category';
type OperatorType =
  | 'is'
  | 'isNot'
  | 'contains'
  | 'doesNotContain'
  | 'isGreaterThan'
  | 'isLessThan';

export interface Condition {
  id: string;
  type: ConditionType;
  operator: OperatorType;
  value: string;
}

// Define the product discount data structure that will be passed to the form
export interface ProductDiscountData {
  id?: string;
  version?: number;
  name: string;
  description: string;
  isActive: boolean;
  discountValue: number;
  discountType: 'percentage' | 'absolute';
  sortOrder: string;
  applyTo: 'all' | 'specific';
  conditions: Condition[];
}

interface ProductDiscountWrapperProps {
  linkToWelcome: string;
  onBack: () => void;
  isEditing?: boolean;
}

const ProductDiscountWrapper: React.FC<ProductDiscountWrapperProps> = ({
  linkToWelcome,
  onBack,
  isEditing = false,
}) => {
  const intl = useIntl();
  const { promotionId } = useParams<{ promotionId?: string }>();
  const { storeKey: channelKey } = useAuthContext();
  const { getPromotionById, loading, error } = usePromotions();
  const [discountData, setDiscountData] = useState<ProductDiscountData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(isEditing);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Parse conditions from existing promotion predicate
  const parseConditionsFromPredicate = (predicate: string): Condition[] => {
    // Skip if predicate only contains channel key condition
    if (predicate.trim() === `channel.key = "${channelKey}"`) {
      return [];
    }

    const conditions: Condition[] = [];

    try {
      // Extract the conditions part (remove channel.key condition)
      const cleanPredicate = predicate
        .replace(`channel.key = "${channelKey}" and `, '')
        .replace(` and channel.key = "${channelKey}"`, '');

      // Simple parsing for now - can be enhanced for more complex predicates
      // Split by " and " to get individual conditions
      const conditionStrings = cleanPredicate.split(' and ');

      conditionStrings.forEach((condString, index) => {
        const skuMatch = condString.match(/sku\s+(=|!=)\s+"([^"]+)"/);
        const skuContainsMatch = condString.match(/sku\s+contains\s+"([^"]+)"/);
        const skuNotContainsMatch = condString.match(
          /not\(sku\s+contains\s+"([^"]+)"\)/
        );
        const categoryMatch = condString.match(
          /categories\.key\s+contains\s+"([^"]+)"/
        );
        const categoryNotMatch = condString.match(
          /not\(categories\.key\s+contains\s+"([^"]+)"\)/
        );

        let condition: Condition | null = null;

        if (skuMatch) {
          condition = {
            id: `condition-${index}`,
            type: 'sku',
            operator: skuMatch[1] === '=' ? 'is' : 'isNot',
            value: skuMatch[2],
          };
        } else if (skuContainsMatch) {
          condition = {
            id: `condition-${index}`,
            type: 'sku',
            operator: 'contains',
            value: skuContainsMatch[1],
          };
        } else if (skuNotContainsMatch) {
          condition = {
            id: `condition-${index}`,
            type: 'sku',
            operator: 'doesNotContain',
            value: skuNotContainsMatch[1],
          };
        } else if (categoryMatch) {
          condition = {
            id: `condition-${index}`,
            type: 'category',
            operator: 'contains',
            value: categoryMatch[1],
          };
        } else if (categoryNotMatch) {
          condition = {
            id: `condition-${index}`,
            type: 'category',
            operator: 'doesNotContain',
            value: categoryNotMatch[1],
          };
        }

        if (condition) {
          conditions.push(condition);
        }
      });
    } catch (err) {
      console.error('Error parsing predicate conditions:', err);
    }

    return conditions.length > 0 ? conditions : [];
  };

  // Parse discount value from promotion
  const parseDiscountValue = (
    promotion: PromotionData
  ): {
    discountValue: number;
    discountType: 'percentage' | 'absolute';
  } => {
    const valueAmount = promotion.valueAmount || '';

    if (valueAmount.includes('%')) {
      // It's a percentage discount
      const percentage = parseFloat(valueAmount.replace('%', ''));
      return {
        discountValue: percentage,
        discountType: 'percentage',
      };
    } else {
      // It's an absolute discount
      // Remove currency symbol and parse
      const amount = parseFloat(valueAmount.replace(/[^0-9.]/g, ''));
      return {
        discountValue: amount,
        discountType: 'absolute',
      };
    }
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

  // Initialize form data based on if we're editing or creating
  const getProductDiscountData = (
    promotion?: PromotionData | null
  ): ProductDiscountData => {
    if (isEditing && promotion) {
      return {
        id: promotion.id,
        version: promotion.version,
        name: promotion.name,
        description: promotion.description || '',
        isActive: promotion.isActive,
        ...parseDiscountValue(promotion),
        sortOrder: promotion.sortOrder,
        applyTo:
          parseConditionsFromPredicate(promotion.predicate).length > 0
            ? ('specific' as const)
            : ('all' as const),
        conditions: parseConditionsFromPredicate(promotion.predicate),
      };
    } else {
      return {
        name: '',
        description: '',
        isActive: true,
        discountValue: 10,
        discountType: 'percentage' as const,
        sortOrder: generateRandomSortOrder(),
        applyTo: 'all' as const,
        conditions: [],
      };
    }
  };

  // Load promotion data if editing
  useEffect(() => {
    const fetchPromotion = async () => {
      if (!isEditing || !promotionId) {
        // If not editing or no ID provided, initialize with empty data
        setDiscountData(getProductDiscountData());
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const promotion = await getPromotionById(promotionId);

        if (!promotion) {
          setLoadError(intl.formatMessage(messages.promotionNotFound));
          setIsLoading(false);
          return;
        }

        const formattedData = getProductDiscountData(promotion);
        setDiscountData(formattedData);
      } catch (err) {
        console.error('Error loading promotion:', err);
        setLoadError(
          err instanceof Error
            ? err.message
            : intl.formatMessage(messages.promotionLoadError)
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchPromotion();
  }, [promotionId, isEditing, getPromotionById, channelKey, intl]);

  if (isLoading) {
    return (
      <Spacings.Stack scale="l" alignItems="center">
        <LoadingSpinner scale="l" />
        <Text.Body>{intl.formatMessage(messages.loadingPromotion)}</Text.Body>
      </Spacings.Stack>
    );
  }

  if (loadError) {
    return (
      <Spacings.Stack scale="l">
        <ContentNotification type="error">
          <Text.Body>{loadError}</Text.Body>
        </ContentNotification>
      </Spacings.Stack>
    );
  }

  if (!discountData) {
    return (
      <Spacings.Stack scale="l">
        <ContentNotification type="error">
          <Text.Body>
            {intl.formatMessage(messages.promotionDataError)}
          </Text.Body>
        </ContentNotification>
      </Spacings.Stack>
    );
  }

  return (
    <ProductDiscountForm
      linkToWelcome={linkToWelcome}
      onBack={onBack}
      isEditing={isEditing}
      initialData={discountData}
    />
  );
};

export default ProductDiscountWrapper;
