import { InfoModalPage } from '@commercetools-frontend/application-components';
import Card from '@commercetools-uikit/card';
import Constraints from '@commercetools-uikit/constraints';
import {
  CartIcon,
  GearIcon,
  InformationIcon,
  TagIcon,
  WorldIcon,
  HeartIcon,
} from '@commercetools-uikit/icons';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useStoreCustomers from '../../hooks/use-store-customers';
import useCustomerPets from '../../hooks/use-customer-pets';
import type { PetInfo } from '../../hooks/use-customer-pets';
import { useClassNames } from '../../../utils/use-classnames';
import styles from './customers.module.css';
import PetCard from './pet-card';
import { FEATURE_FLAG_VET_KEY } from '../../../constants';
import { useFeatureFlagContext } from '../../contexts/feature-flag-context';

// Define the Order interface
interface Order {
  id: string;
  orderNumber?: string;
  createdAt: string;
  totalPrice: {
    centAmount: number;
    currencyCode: string;
  };
  orderState: string;
}

interface Customer {
  id: string;
  version: number;
  email: string;
  firstName?: string;
  lastName?: string;
  customerNumber?: string;
  createdAt: string;
  lastModifiedAt?: string;
  isEmailVerified: boolean;
  customerGroup?: {
    id: string;
    name?: string;
  };
  stores?: Array<{
    key: string;
  }>;
  addresses?: Array<{
    id: string;
    firstName?: string;
    lastName?: string;
    streetName?: string;
    streetNumber?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    phone?: string;
    email?: string;
  }>;
  defaultShippingAddressId?: string;
  defaultBillingAddressId?: string;
  custom?: {
    customFieldsRaw: Array<{
      name: string;
      value: string;
    }>;
  };
}

interface CustomerDetailsModalProps {
  linkToWelcome: string;
  onBack: () => void;
}

const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  linkToWelcome,
  onBack,
}) => {
  const { customerId } = useParams<{ customerId: string }>();
  const { fetchCustomerOrders, fetchCustomerById } = useStoreCustomers({});
  const {
    fetchPetsByCustomerId,
    pets,
    loading: loadingPets,
  } = useCustomerPets();
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const { featureFlags } = useFeatureFlagContext();
  // Fetch customer data, orders, and pets when modal opens
  useEffect(() => {
    if (customerId) {
      setLoadingOrders(true);
      fetchCustomerById(customerId).then((customer) => {
        setCustomer(customer);
      });

      fetchCustomerOrders(customerId)
        .then((orders) => {
          setCustomerOrders(orders);
        })
        .finally(() => {
          setLoadingOrders(false);
        });

      // Fetch pet data
      fetchPetsByCustomerId(customerId);
    }
  }, [
    customerId,
    fetchCustomerOrders,
    fetchCustomerById,
    fetchPetsByCustomerId,
  ]);

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

  const getDefaultAddress = (addressId?: string) => {
    if (!addressId || !customer?.addresses) return 'None set';

    const address = customer.addresses.find((addr) => addr.id === addressId);
    return address ? formatAddress(address) : 'Address not found';
  };

  const getCustomerGroup = () => {
    if (customer?.customerGroup?.name) {
      return customer.customerGroup.name;
    }
    if (customer?.customerGroup?.id) {
      return `ID: ${customer.customerGroup.id}`;
    }
    return 'N/A';
  };

  // Format price for display
  const formatPrice = (cents: number, currency: string) => {
    const amount = cents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  // Define a detail item component for consistent styling
  const DetailItem = ({
    label,
    value,
  }: {
    label: string;
    value?: string | object;
  }) => {
    if (typeof value === 'object') {
      return null;
    }
    return (
      <div className={styles.detailItem}>
        <div className={styles.detailLabel}>
          <Text.Body isBold>{label}</Text.Body>
        </div>
        <div className={styles.detailValue}>
          <Text.Body>{value || 'N/A'}</Text.Body>
        </div>
      </div>
    );
  };

  // Get order status class based on state
  const getOrderStatusClass = (state: string) => {
    const statusMap: { [key: string]: string } = {
      Open: styles.statusOpen,
      Confirmed: styles.statusConfirmed,
      Complete: styles.statusComplete,
      Cancelled: styles.statusCancelled,
    };
    return statusMap[state] || '';
  };

  return (
    <div data-testid="customer-details-modal">
      <InfoModalPage
        title={`Customer: ${
          customer?.firstName || customer?.lastName
            ? `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim()
            : customer?.email
        }`}
        onClose={onBack}
        isOpen={true}
      >
        <Constraints.Horizontal max="scale">
          <Spacings.Stack scale="m">
            {/* Customer Information Section */}
            <Card>
              <Spacings.Stack scale="m">
                <div className={styles.sectionDivider}>
                  <Spacings.Inline alignItems="center" scale="xs">
                    <InformationIcon size="medium" color="neutral60" />
                    <div className={styles.sectionHeader}>
                      <Text.Subheadline as="h4" isBold>
                        Customer Information
                      </Text.Subheadline>
                    </div>
                  </Spacings.Inline>
                </div>

                <div className={styles.detailGrid}>
                  <DetailItem label="Customer ID" value={customer?.id} />
                  <DetailItem label="Email" value={customer?.email} />
                  {(customer?.firstName || customer?.lastName) && (
                    <DetailItem
                      label="Name"
                      value={`${customer?.firstName || ''} ${
                        customer?.lastName || ''
                      }`.trim()}
                    />
                  )}
                  {customer?.customerNumber && (
                    <DetailItem
                      label="Customer Number"
                      value={customer?.customerNumber}
                    />
                  )}
                </div>
              </Spacings.Stack>
            </Card>

            {/* Account Details Section */}
            <Card>
              <Spacings.Stack scale="m">
                <div className={styles.sectionDivider}>
                  <Spacings.Inline alignItems="center" scale="xs">
                    <GearIcon size="medium" color="neutral60" />
                    <div className={styles.sectionHeader}>
                      <Text.Subheadline as="h4" isBold>
                        Account Details
                      </Text.Subheadline>
                    </div>
                  </Spacings.Inline>
                </div>

                <div className={styles.detailGrid}>
                  <DetailItem
                    label="Created At"
                    value={
                      customer?.createdAt
                        ? new Date(customer?.createdAt).toLocaleString()
                        : 'N/A'
                    }
                  />
                  {customer?.lastModifiedAt && (
                    <DetailItem
                      label="Last Modified"
                      value={
                        customer?.lastModifiedAt
                          ? new Date(customer?.lastModifiedAt).toLocaleString()
                          : 'N/A'
                      }
                    />
                  )}
                  <DetailItem
                    label="Customer Group"
                    value={getCustomerGroup()}
                  />
                </div>
              </Spacings.Stack>
            </Card>

            {/* Addresses Section */}
            {customer?.addresses && customer?.addresses.length > 0 && (
              <Card>
                <Spacings.Stack scale="m">
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

                  <div className={styles.detailGrid}>
                    <DetailItem
                      label="Default Shipping"
                      value={getDefaultAddress(
                        customer?.defaultShippingAddressId
                      )}
                    />
                    <DetailItem
                      label="Default Billing"
                      value={getDefaultAddress(
                        customer.defaultBillingAddressId
                      )}
                    />
                  </div>

                  <div className={styles.addressesGrid}>
                    {customer.addresses.map((address, index) => (
                      <Card
                        key={address.id || index}
                        className={styles.addressCard}
                      >
                        <Spacings.Stack scale="xs">
                          <Text.Subheadline as="h5">
                            Address {index + 1}
                          </Text.Subheadline>
                          <Text.Body>{formatAddress(address)}</Text.Body>
                        </Spacings.Stack>
                      </Card>
                    ))}
                  </div>
                </Spacings.Stack>
              </Card>
            )}

            {/* Custom Fields Section */}
            {customer?.custom &&
              customer?.custom?.customFieldsRaw &&
              customer?.custom?.customFieldsRaw?.length > 0 && (
                <Card>
                  <Spacings.Stack scale="m">
                    <div className={styles.sectionDivider}>
                      <Spacings.Inline alignItems="center" scale="xs">
                        <TagIcon size="medium" color="neutral60" />
                        <div className={styles.sectionHeader}>
                          <Text.Subheadline as="h4" isBold>
                            Custom Fields
                          </Text.Subheadline>
                        </div>
                      </Spacings.Inline>
                    </div>

                    <div className={styles.detailGrid}>
                      {customer.custom?.customFieldsRaw?.map((field) => (
                        <DetailItem
                          key={field.name}
                          label={field.name}
                          value={field.value}
                        />
                      ))}
                    </div>
                  </Spacings.Stack>
                </Card>
              )}

            {/* Customer Orders Section */}
            <Card>
              <Spacings.Stack scale="m">
                <div className={styles.sectionDivider}>
                  <Spacings.Inline alignItems="center" scale="xs">
                    <CartIcon size="medium" color="neutral60" />
                    <div className={styles.sectionHeader}>
                      <Text.Subheadline as="h4" isBold>
                        Recent Orders
                      </Text.Subheadline>
                    </div>
                  </Spacings.Inline>
                </div>

                {loadingOrders ? (
                  <div className={styles.centerLoading}>
                    <LoadingSpinner scale="s" />
                  </div>
                ) : customerOrders.length === 0 ? (
                  <div className={styles.emptyMessage}>
                    <Text.Body>No orders found for this customer</Text.Body>
                  </div>
                ) : (
                  <div className={styles.addressesGrid}>
                    {customerOrders.slice(0, 5).map((order) => (
                      <Link
                        key={order.id}
                        to={`${linkToWelcome}/orders/${order.id}`}
                      >
                        <Card
                          className={useClassNames(
                            styles.addressCard,
                            styles.link
                          )}
                        >
                          <Spacings.Stack scale="s">
                            <Spacings.Inline
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Text.Subheadline as="h5">
                                {order.orderNumber || order.id.slice(0, 8)}
                              </Text.Subheadline>
                              <div
                                className={`${
                                  styles.orderStatus
                                } ${getOrderStatusClass(order.orderState)}`}
                              >
                                {order.orderState}
                              </div>
                            </Spacings.Inline>
                            <Text.Detail tone="secondary">
                              Created:{' '}
                              {new Date(order.createdAt).toLocaleString()}
                            </Text.Detail>
                            <Text.Body isBold>
                              {formatPrice(
                                order.totalPrice.centAmount,
                                order.totalPrice.currencyCode
                              ) || 'N/A'}
                            </Text.Body>
                          </Spacings.Stack>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </Spacings.Stack>
            </Card>

            {/* Pets Section */}
            {typeof featureFlags[FEATURE_FLAG_VET_KEY] !== 'undefined' &&
              featureFlags[FEATURE_FLAG_VET_KEY] !== false && (
                <Card>
                  <Spacings.Stack scale="m">
                    <div className={styles.sectionDivider}>
                      <Spacings.Inline alignItems="center" scale="xs">
                        <HeartIcon size="medium" color="neutral60" />
                        <div className={styles.sectionHeader}>
                          <Text.Subheadline as="h4" isBold>
                            Pets
                          </Text.Subheadline>
                        </div>
                      </Spacings.Inline>
                    </div>

                    {loadingPets ? (
                      <div className={styles.petLoadingContainer}>
                        <LoadingSpinner scale="s" />
                        <Text.Body>Loading pet information...</Text.Body>
                      </div>
                    ) : pets.length === 0 ? (
                      <div className={styles.emptyMessage}>
                        <Text.Body>No pets found for this customer</Text.Body>
                      </div>
                    ) : (
                      <div className={styles.petsDetailGrid}>
                        {pets.map((pet) => (
                          <PetCard key={`pet-${pet.id}`} pet={pet} />
                        ))}
                      </div>
                    )}
                  </Spacings.Stack>
                </Card>
              )}
          </Spacings.Stack>
        </Constraints.Horizontal>
      </InfoModalPage>
    </div>
  );
};

export default CustomerDetailsModal;
