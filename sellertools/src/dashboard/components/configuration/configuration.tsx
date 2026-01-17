import { useShowNotification } from '@commercetools-frontend/actions-global';
import { DOMAINS } from '@commercetools-frontend/constants';
import Card from '@commercetools-uikit/card';
import { BackIcon } from '@commercetools-uikit/icons';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import { ContentNotification } from '@commercetools-uikit/notifications';
import PrimaryButton from '@commercetools-uikit/primary-button';
import SecondaryButton from '@commercetools-uikit/secondary-button';
import SelectField from '@commercetools-uikit/select-field';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import TextField from '@commercetools-uikit/text-field';
import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useAuthContext } from '../../contexts/auth-context';
import useCustomerBusinessUnits from '../../hooks/use-customer-business-units';
import styles from './configuration.module.css';
import messages from './messages';

type ConfigurationProps = {
  onBack: () => void;
  linkToWelcome: string;
};

type StoreConfigData = {
  name: string;
  streetNumber: string;
  street: string;
  city: string;
  state: string;
  zipcode: string;
  phoneNumber: string;
  openTime: string;
  closeTime: string;
  stripeAccountId: string;
};

// Define type for custom field to fix type errors
type CustomField = {
  name: string;
  value: string | string[] | unknown;
};

// Define type for business unit for the selector
interface BusinessUnit {
  id: string;
  name: string;
}

// Generate time options for select fields
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const formattedHour = hour.toString().padStart(2, '0');
      const formattedMinute = minute.toString().padStart(2, '0');
      const time = `${formattedHour}:${formattedMinute}`;
      options.push({ value: time, label: time });
    }
  }
  return options;
};

const Configuration: React.FC<ConfigurationProps> = ({ onBack }) => {
  const intl = useIntl();
  const showNotification = useShowNotification();
  const { customerDetails } = useAuthContext();
  const timeOptions = generateTimeOptions();

  // Get business units data using the hook
  const {
    businessUnits,
    selectedBusinessUnit,
    loading,
    error,
    fetchBusinessUnitsByCustomerId,
    selectBusinessUnit,
    updateBusinessUnit,
  } = useCustomerBusinessUnits();

  // Track if saving is in progress
  const [isSaving, setIsSaving] = useState(false);

  // Initial state - will be populated with business unit data when fetched
  const [formData, setFormData] = useState<StoreConfigData>({
    name: '',
    streetNumber: '',
    street: '',
    city: '',
    state: '',
    zipcode: '',
    phoneNumber: '',
    openTime: '09:00',
    closeTime: '17:00',
    stripeAccountId: '',
  });

  // Track original data to detect changes
  const [originalData, setOriginalData] = useState<StoreConfigData | null>(
    null
  );

  // Fetch business units data on component mount using customer ID from auth context
  useEffect(() => {
    if (customerDetails?.id) {
      fetchBusinessUnitsByCustomerId(customerDetails.id);
    } else {
      console.error('No customer ID available in auth context');
      showNotification({
        kind: 'error',
        domain: DOMAINS.SIDE,
        text: intl.formatMessage(messages.errorNoCustomerId),
      });
    }
  }, [fetchBusinessUnitsByCustomerId, customerDetails, showNotification, intl]);

  // Update form data when selected business unit changes
  useEffect(() => {
    if (selectedBusinessUnit) {
      const address = selectedBusinessUnit.addresses[0] || {};
      let openTime = '09:00';
      let closeTime = '17:00';
      let stripeAccountId = '';

      // Extract custom fields
      if (
        selectedBusinessUnit.custom &&
        selectedBusinessUnit.custom.customFieldsRaw
      ) {
        // Get hours of operation
        const hoursField = selectedBusinessUnit.custom.customFieldsRaw.find(
          (field: CustomField) => field.name === 'hours-of-operation'
        );
        if (
          hoursField &&
          Array.isArray(hoursField.value) &&
          hoursField.value.length >= 2
        ) {
          // Format time from "09:00:00" to "09:00"
          openTime = String(hoursField.value[0]).substring(0, 5);
          closeTime = String(hoursField.value[1]).substring(0, 5);
        }

        // Get Stripe Account ID
        const stripeField = selectedBusinessUnit.custom.customFieldsRaw.find(
          (field: CustomField) => field.name === 'stripeAccountId'
        );
        if (stripeField && typeof stripeField.value === 'string') {
          stripeAccountId = stripeField.value;
        }
      }

      // Update form data with business unit data
      const newFormData = {
        name: selectedBusinessUnit.name || '',
        streetNumber: address.streetNumber || '',
        street: address.streetName || '',
        city: address.city || '',
        state: address.state || '',
        zipcode: address.postalCode || '',
        phoneNumber: address.phone || '',
        openTime,
        closeTime,
        stripeAccountId,
      };

      setFormData(newFormData);
      setOriginalData(newFormData);
    }
  }, [selectedBusinessUnit]);

  // Form field handlers
  const handleChange =
    (field: keyof StoreConfigData) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({
        ...formData,
        [field]: event.target.value,
      });
    };

  // Updated event handler for SelectField
  const handleTimeChange =
    (field: 'openTime' | 'closeTime') => (event: any) => {
      const value = event.target.value;
      if (typeof value === 'string') {
        setFormData({
          ...formData,
          [field]: value,
        });
      }
    };

  // Check if any field has changed
  const hasChanges = (): boolean => {
    if (!originalData) return false;

    return Object.keys(formData).some((key) => {
      return (
        formData[key as keyof StoreConfigData] !==
        originalData[key as keyof StoreConfigData]
      );
    });
  };

  const handleSave = async () => {
    if (!hasChanges()) {
      showNotification({
        kind: 'info',
        domain: DOMAINS.SIDE,
        text: 'No changes to save',
      });
      return;
    }

    if (!selectedBusinessUnit) {
      showNotification({
        kind: 'error',
        domain: DOMAINS.SIDE,
        text: 'No business unit selected',
      });
      return;
    }

    setIsSaving(true);

    try {
      // Prepare address data for update
      const addressData = {
        streetNumber: formData.streetNumber,
        streetName: formData.street,
        city: formData.city,
        state: formData.state,
        postalCode: formData.zipcode,
        phone: formData.phoneNumber,
      };

      // Prepare custom fields
      const customFields = {
        stripeAccountId: formData.stripeAccountId,
        'hours-of-operation': [
          `${formData.openTime}:00`, // Add seconds to match expected format
          `${formData.closeTime}:00`, // Add seconds to match expected format
        ],
      };

      // Update business unit
      const updatedBusinessUnit = await updateBusinessUnit(
        selectedBusinessUnit.id,
        addressData,
        customFields
      );

      if (updatedBusinessUnit) {
        // Update original data to reflect the saved changes
        setOriginalData({ ...formData });

        // Show success notification
        showNotification({
          kind: 'success',
          domain: DOMAINS.SIDE,
          text: intl.formatMessage(messages.configurationSaved),
        });
      }
    } catch (error) {
      console.error('Error saving configuration:', error);

      // Show error notification
      showNotification({
        kind: 'error',
        domain: DOMAINS.SIDE,
        text:
          intl.formatMessage(messages.errorSaving) +
          (error instanceof Error ? `: ${error.message}` : ''),
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading indicator while fetching business unit data
  if (loading && !isSaving) {
    return (
      <div className={styles.configurationContainer}>
        <Spacings.Stack alignItems="center" scale="l">
          <LoadingSpinner />
          <Text.Body>Loading store configuration...</Text.Body>
        </Spacings.Stack>
      </div>
    );
  }

  // Show error message if there was an error fetching business unit data
  if (error && !isSaving) {
    return (
      <div className={styles.configurationContainer}>
        <Spacings.Stack scale="l">
          <ContentNotification type="error">
            <Text.Body>
              Error loading store configuration: {error.message}
            </Text.Body>
          </ContentNotification>
          <SecondaryButton
            label={intl.formatMessage(messages.backToWelcome)}
            onClick={onBack}
            iconLeft={<BackIcon />}
          />
        </Spacings.Stack>
      </div>
    );
  }

  // Show message if no business units were found
  if (businessUnits.length === 0 && !loading && !error) {
    return (
      <div className={styles.configurationContainer}>
        <Spacings.Stack scale="l">
          <ContentNotification type="info">
            <Text.Body>No business units found for this customer.</Text.Body>
          </ContentNotification>
          <SecondaryButton
            label={intl.formatMessage(messages.backToWelcome)}
            onClick={onBack}
            iconLeft={<BackIcon />}
          />
        </Spacings.Stack>
      </div>
    );
  }

  return (
    <div className={styles.configurationContainer}>
      <Spacings.Stack scale="xl">
        <div className={styles.header}>
          <div>
            <Text.Headline as="h1">
              {intl.formatMessage(messages.title)}
            </Text.Headline>
          </div>
          <SecondaryButton
            label={intl.formatMessage(messages.backToWelcome)}
            onClick={onBack}
            iconLeft={<BackIcon />}
            className={styles.backButton}
          />
        </div>

        {/* Business unit selector if multiple business units available */}
        {businessUnits.length > 1 && (
          <Card>
            <Spacings.Stack scale="m">
              <Text.Headline as="h2">Select Business Unit</Text.Headline>
              <SelectField
                title="Business Unit"
                value={selectedBusinessUnit?.id || ''}
                onChange={(event) => {
                  const selectedId = event.target.value;
                  if (typeof selectedId === 'string') {
                    selectBusinessUnit(selectedId);
                  }
                }}
                options={businessUnits.map((unit: BusinessUnit) => ({
                  value: unit.id,
                  label: unit.name,
                }))}
                isDisabled={isSaving}
              />
            </Spacings.Stack>
          </Card>
        )}

        <Card>
          <Spacings.Stack scale="l">
            {/* Store Name */}
            <TextField
              title={intl.formatMessage(messages.storeName)}
              value={formData.name}
              onChange={handleChange('name')}
              placeholder={intl.formatMessage(messages.storeNamePlaceholder)}
              horizontalConstraint={13}
              isDisabled={isSaving}
            />

            {/* Address Fields */}
            <Spacings.Stack scale="m">
              <div className={styles.addressGrid}>
                <div className={styles.streetNumberField}>
                  <TextField
                    title={intl.formatMessage(messages.streetNumber)}
                    value={formData.streetNumber}
                    onChange={handleChange('streetNumber')}
                    placeholder={intl.formatMessage(
                      messages.streetNumberPlaceholder
                    )}
                    isDisabled={isSaving}
                  />
                </div>
                <div className={styles.streetField}>
                  <TextField
                    title={intl.formatMessage(messages.street)}
                    value={formData.street}
                    onChange={handleChange('street')}
                    placeholder={intl.formatMessage(messages.streetPlaceholder)}
                    isDisabled={isSaving}
                  />
                </div>
                <TextField
                  title={intl.formatMessage(messages.city)}
                  value={formData.city}
                  onChange={handleChange('city')}
                  placeholder={intl.formatMessage(messages.cityPlaceholder)}
                  isDisabled={isSaving}
                />
                <TextField
                  title={intl.formatMessage(messages.state)}
                  value={formData.state}
                  onChange={handleChange('state')}
                  placeholder={intl.formatMessage(messages.statePlaceholder)}
                  isDisabled={isSaving}
                />
                <TextField
                  title={intl.formatMessage(messages.zipcode)}
                  value={formData.zipcode}
                  onChange={handleChange('zipcode')}
                  placeholder={intl.formatMessage(messages.zipcodePlaceholder)}
                  isDisabled={isSaving}
                />
              </div>
            </Spacings.Stack>

            {/* Phone Number */}
            <TextField
              title={intl.formatMessage(messages.phoneNumber)}
              value={formData.phoneNumber}
              onChange={handleChange('phoneNumber')}
              placeholder={intl.formatMessage(messages.phoneNumberPlaceholder)}
              horizontalConstraint={7}
              isDisabled={isSaving}
            />

            {/* Hours of Operation */}
            <div className={styles.hoursContainer}>
              <SelectField
                title={intl.formatMessage(messages.openTime)}
                value={formData.openTime}
                onChange={handleTimeChange('openTime')}
                options={timeOptions}
                horizontalConstraint="scale"
                isDisabled={isSaving}
              />
              <SelectField
                title={intl.formatMessage(messages.closeTime)}
                value={formData.closeTime}
                onChange={handleTimeChange('closeTime')}
                options={timeOptions}
                horizontalConstraint="scale"
                isDisabled={isSaving}
              />
            </div>

            {/* Stripe Account ID */}
            <TextField
              title={intl.formatMessage(messages.stripeAccountId)}
              value={formData.stripeAccountId}
              onChange={handleChange('stripeAccountId')}
              placeholder={intl.formatMessage(
                messages.stripeAccountIdPlaceholder
              )}
              horizontalConstraint={13}
              isDisabled={isSaving}
            />

            <div className={styles.saveButtonContainer}>
              <PrimaryButton
                label={intl.formatMessage(messages.save)}
                onClick={handleSave}
                isDisabled={!hasChanges() || isSaving}
              />
              {isSaving && <LoadingSpinner />}
            </div>
          </Spacings.Stack>
        </Card>
      </Spacings.Stack>
    </div>
  );
};

export default Configuration;
