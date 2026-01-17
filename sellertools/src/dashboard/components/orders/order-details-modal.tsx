import { InfoModalPage } from '@commercetools-frontend/application-components';
import Card from '@commercetools-uikit/card';
import Constraints from '@commercetools-uikit/constraints';
import Table from '@commercetools-uikit/data-table';
import {
  CartIcon,
  CoinsIcon,
  InformationIcon,
  UsersIcon,
  WorldIcon,
} from '@commercetools-uikit/icons';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import useOrders from '../../hooks/use-orders/use-orders';
import { formatPrice } from '../../../utils/price';
import styles from './orders.module.css';

interface OrderDetailsModalProps {
  linkToWelcome: string;
  onBack: () => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ onBack }) => {
  const { orderId } = useParams<{ orderId?: string }>();

  const { fetchOrderById } = useOrders({});
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrderById(orderId)
        .then(setOrder)
        .catch(setError)
        .finally(() => setLoading(false));
    }
  }, [orderId, fetchOrderById]);

  const orderTotal = useMemo(() => {
    return formatPrice(
      order?.totalPrice?.centAmount || 0,
      order?.totalPrice?.currencyCode || 'USD'
    );
  }, [order]);

  const formatAddress = (address: any) => {
    if (!address) return 'Not available';

    const parts = [];
    if (address.firstName || address.lastName) {
      parts.push(`${address.firstName || ''} ${address.lastName || ''}`.trim());
    }

    if (address.streetName) {
      let street = address.streetName;
      if (address.streetNumber) street += ` ${address.streetNumber}`;
      parts.push(street);
    }

    if (address.city || address.postalCode) {
      parts.push(`${address.city || ''} ${address.postalCode || ''}`.trim());
    }

    if (address.country) {
      parts.push(address.country);
    }

    return parts.join(', ') || 'Not available';
  };

  // Define columns for line items table
  const lineItemColumns = [
    {
      key: 'image',
      label: 'Image',
      renderItem: (row: any) => {
        const imageUrl = row.imageUrl;
        return imageUrl ? (
          <img src={imageUrl} alt={row.name} className={styles.productImage} />
        ) : (
          <div className={styles.noImage}>No image</div>
        );
      },
    },
    { key: 'name', label: 'Product' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'price', label: 'Unit Price' },
    { key: 'total', label: 'Total' },
  ];

  // Map line items to table rows
  const lineItemRows = useMemo(() => {
    return (
      order?.lineItems?.map((item: any) => ({
        id: item.id,
        name: item.name,
        imageUrl:
          item.variant?.images && item.variant.images.length > 0
            ? item.variant.images[0].url
            : null,
        quantity: item.quantity,
        price: formatPrice(
          item.price.value.centAmount,
          item.price.value.currencyCode
        ),
        total: formatPrice(
          item.totalPrice.centAmount,
          item.totalPrice.currencyCode
        ),
      })) || []
    );
  }, [order]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <InfoModalPage
      data-testid="order-details-modal"
      title={`Order ${order.orderNumber || order.id}`}
      isOpen={true}
      onClose={onBack}
    >
      <Constraints.Horizontal max={16}>
        <Spacings.Stack scale="m">
          <Card>
            <Spacings.Stack scale="m">
              <Spacings.Inline justifyContent="space-between">
                <Text.Headline as="h3">Order Details</Text.Headline>
                <div
                  className={`${styles.orderStatus} ${
                    styles[order.orderState.toLowerCase()]
                  }`}
                >
                  {order.orderState}
                </div>
              </Spacings.Inline>

              <div className={styles.sectionDivider}>
                <Spacings.Inline alignItems="center" scale="xs">
                  <InformationIcon size="medium" color="neutral60" />
                  <div className={styles.sectionHeader}>
                    <Text.Subheadline as="h4" isBold>
                      Order Information
                    </Text.Subheadline>
                  </div>
                </Spacings.Inline>
              </div>

              <Spacings.Stack scale="s">
                <Spacings.Inline alignItems="flex-start">
                  <div className={styles.detailSection}>
                    <div className={styles.detailLabel}>
                      <Text.Body isBold>Order ID</Text.Body>
                    </div>
                    <div className={styles.detailValue}>
                      <Text.Body>{order.id}</Text.Body>
                    </div>
                  </div>
                </Spacings.Inline>

                <Spacings.Inline alignItems="flex-start">
                  <div className={styles.detailSection}>
                    <div className={styles.detailLabel}>
                      <Text.Body isBold>Created</Text.Body>
                    </div>
                    <div className={styles.detailValue}>
                      <Text.Body>{order.createdAt}</Text.Body>
                    </div>
                  </div>
                </Spacings.Inline>

                {order.lastModifiedAt && (
                  <Spacings.Inline alignItems="flex-start">
                    <div className={styles.detailSection}>
                      <div className={styles.detailLabel}>
                        <Text.Body isBold>Last Modified</Text.Body>
                      </div>
                      <div className={styles.detailValue}>
                        <Text.Body truncate>{order.lastModifiedAt}</Text.Body>
                      </div>
                    </div>
                  </Spacings.Inline>
                )}

                <Spacings.Inline alignItems="flex-start">
                  <div className={styles.detailSection}>
                    <div className={styles.detailLabel}>
                      <Text.Body isBold>State</Text.Body>
                    </div>
                    <div className={styles.detailValue}>
                      {order.state?.name ? (
                        <span className={styles.stateBadge}>
                          {order.state.name}
                        </span>
                      ) : (
                        <Text.Body>Not set</Text.Body>
                      )}
                    </div>
                  </div>
                </Spacings.Inline>

                <Spacings.Inline alignItems="flex-start">
                  <div className={styles.detailSection}>
                    <div className={styles.detailLabel}>
                      <Text.Body isBold>Status</Text.Body>
                    </div>
                    <div className={styles.detailValue}>
                      <Text.Body>{order.orderState}</Text.Body>
                    </div>
                  </div>
                </Spacings.Inline>
              </Spacings.Stack>

              <div className={styles.sectionDivider}>
                <Spacings.Inline alignItems="center" scale="xs">
                  <UsersIcon size="medium" color="neutral60" />
                  <div className={styles.sectionHeader}>
                    <Text.Subheadline as="h4" isBold>
                      Customer Information
                    </Text.Subheadline>
                  </div>
                </Spacings.Inline>
              </div>

              <Spacings.Stack scale="s">
                {order.customerName && (
                  <Spacings.Inline alignItems="flex-start">
                    <div className={styles.detailSection}>
                      <div className={styles.detailLabel}>
                        <Text.Body isBold>Customer Name</Text.Body>
                      </div>
                      <div className={styles.detailValue}>
                        <Text.Body>{order.customerName}</Text.Body>
                      </div>
                    </div>
                  </Spacings.Inline>
                )}

                <Spacings.Inline alignItems="flex-start">
                  <div className={styles.detailSection}>
                    <div className={styles.detailLabel}>
                      <Text.Body isBold>Customer Email</Text.Body>
                    </div>
                    <div className={styles.detailValue}>
                      <Text.Body>{order.customerEmail || 'N/A'}</Text.Body>
                    </div>
                  </div>
                </Spacings.Inline>

                <Spacings.Inline alignItems="flex-start">
                  <div className={styles.detailSection}>
                    <div className={styles.detailLabel}>
                      <Text.Body isBold>Customer ID</Text.Body>
                    </div>
                    <div className={styles.detailValue}>
                      <Text.Body>{order.customerId || 'N/A'}</Text.Body>
                    </div>
                  </div>
                </Spacings.Inline>
              </Spacings.Stack>

              <div className={styles.sectionDivider}>
                <Spacings.Inline alignItems="center" scale="xs">
                  <WorldIcon size="medium" color="neutral60" />
                  <div className={styles.sectionHeader}>
                    <Text.Subheadline as="h4" isBold>
                      Addresses
                    </Text.Subheadline>
                  </div>
                </Spacings.Inline>
              </div>

              <Spacings.Stack scale="s">
                <div className={styles.detailSection}>
                  <div className={styles.detailLabel}>
                    <Text.Body isBold>Shipping Address</Text.Body>
                  </div>
                  <div className={styles.detailValue}>
                    <Text.Body>
                      {formatAddress(order.shippingAddress)}
                    </Text.Body>
                  </div>
                </div>

                <div className={styles.detailSection}>
                  <div className={styles.detailLabel}>
                    <Text.Body isBold>Billing Address</Text.Body>
                  </div>
                  <div className={styles.detailValue}>
                    <Text.Body>{formatAddress(order.billingAddress)}</Text.Body>
                  </div>
                </div>
              </Spacings.Stack>

              {order.lineItems && order.lineItems.length > 0 && (
                <>
                  <div className={styles.sectionDivider}>
                    <Spacings.Inline alignItems="center" scale="xs">
                      <CartIcon size="medium" color="neutral60" />
                      <div className={styles.sectionHeader}>
                        <Text.Subheadline as="h4" isBold>
                          Line Items
                        </Text.Subheadline>
                      </div>
                    </Spacings.Inline>
                  </div>

                  <Table
                    columns={lineItemColumns}
                    rows={lineItemRows}
                    maxHeight="400px"
                  />
                </>
              )}

              <div className={styles.sectionDivider}>
                <Spacings.Inline
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Spacings.Inline alignItems="center" scale="xs">
                    <CoinsIcon size="medium" color="neutral60" />
                    <div className={styles.sectionHeader}>
                      <Text.Subheadline as="h4" isBold>
                        Order Total
                      </Text.Subheadline>
                    </div>
                  </Spacings.Inline>
                  <Text.Headline as="h3" tone="primary">
                    {orderTotal}
                  </Text.Headline>
                </Spacings.Inline>
              </div>
            </Spacings.Stack>
          </Card>
        </Spacings.Stack>
      </Constraints.Horizontal>
    </InfoModalPage>
  );
};

export default OrderDetailsModal;
