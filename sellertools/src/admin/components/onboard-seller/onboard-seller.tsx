import React from 'react';
import { useHistory } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { Formik } from 'formik';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import TextField from '@commercetools-uikit/text-field';
import PrimaryButton from '@commercetools-uikit/primary-button';
import Card from '@commercetools-uikit/card';
import { useShowNotification } from '@commercetools-frontend/actions-global';
import { NOTIFICATION_KINDS_SIDE } from '@commercetools-frontend/constants';
import useCustomerManagement from '../../hooks/use-customer-management';
import useBusinessUnitManagement from '../../hooks/use-business-unit-management';
import useStoreManagement from '../../hooks/use-store-management';
import useMerchantCenterManagement from '../../hooks/use-merchant-center-management';
import messages from './messages';
import styles from './onboard-seller.module.css';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';

type TFormValues = {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
};

type TFieldErrors = Record<string, boolean>;

type TFormErrors = {
  companyName?: TFieldErrors;
  firstName?: TFieldErrors;
  lastName?: TFieldErrors;
  email?: TFieldErrors;
  phoneNumber?: TFieldErrors;
};

const validate = (values: TFormValues): TFormErrors => {
  const errors: TFormErrors = {};

  // Required field validation
  if (!values.companyName?.trim()) {
    errors.companyName = { missing: true };
  }
  if (!values.firstName?.trim()) {
    errors.firstName = { missing: true };
  }
  if (!values.lastName?.trim()) {
    errors.lastName = { missing: true };
  }
  if (!values.email?.trim()) {
    errors.email = { missing: true };
  }

  // Email validation - only validate format if email is provided
  if (
    values.email &&
    values.email.trim() !== '' &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)
  ) {
    errors.email = { invalid: true };
  }

  // Phone Number validation - only validate format if phone is provided
  if (
    values.phoneNumber &&
    values.phoneNumber.trim() !== '' &&
    !/^\+?[\d\s\-\(\)]+$/.test(values.phoneNumber)
  ) {
    errors.phoneNumber = { invalid: true };
  }

  return errors;
};

const OnboardSeller: React.FC = () => {
  const intl = useIntl();
  const history = useHistory();
  const showNotification = useShowNotification();

  // Custom hooks for GraphQL operations
  const customerManagement = useCustomerManagement();
  const businessUnitManagement = useBusinessUnitManagement();
  const storeManagement = useStoreManagement();
  const merchantCenterManagement = useMerchantCenterManagement();

  const {
    environment,
  }: { environment: { CUSTOMER_GROUP: string; ASSOCIATE_ROLE: string } } =
    useApplicationContext();

  // Loading state - true if any of the hooks are loading
  const isLoading =
    customerManagement.loading ||
    businessUnitManagement.loading ||
    storeManagement.loading ||
    merchantCenterManagement.loading;

  const handleBackToDashboard = () => {
    history.goBack();
  };

  const handleSubmit = async (values: TFormValues) => {
    try {
      console.log('🚀 Starting seller onboarding process...');

      // Transform company name to key format (lowercase, spaces to dashes)
      const companyKey = values.companyName.toLowerCase().replace(/\s+/g, '-');
      const companyName = values.companyName; // Keep original for display

      console.log(
        `📝 Onboarding: ${companyName} (${values.firstName} ${values.lastName})`
      );

      // Step 1: Create the customer with ExternalAuth and customer group
      console.log('👤 Step 1: Creating seller account...');
      const customerGroupKey = environment?.CUSTOMER_GROUP;

      const customer = await customerManagement.createCustomer({
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        companyName: companyName,
        authenticationMode: 'Password',
        password: 'welcome',
        customerGroup: customerGroupKey
          ? {
              typeId: 'customer-group',
              key: customerGroupKey,
            }
          : undefined,
      });

      if (!customer) {
        throw new Error('Failed to create customer');
      }

      // Step 1.1: Create email verification token
      const verificationToken =
        await customerManagement.createEmailVerificationToken(customer.id, 10);

      if (!verificationToken) {
        throw new Error('Failed to create email verification token');
      }

      // Step 1.2: Confirm email with the token
      const verifiedCustomer = await customerManagement.confirmEmail(
        verificationToken
      );

      if (!verifiedCustomer) {
        throw new Error('Failed to verify customer email');
      }

      console.log('✅ Seller account created and verified');

      // Step 2: Create a channel for inventory and product distribution
      console.log('📺 Step 2: Creating channel...');
      const channelKey = `${companyKey}-channel`;
      const channel = await storeManagement.createChannel({
        key: channelKey,
        name: [
          {
            locale: 'en-US',
            value: `${companyName} Channel`,
          },
        ],
        description: [
          {
            locale: 'en-US',
            value: `Distribution and supply channel for ${companyName}`,
          },
        ],
        roles: ['InventorySupply', 'ProductDistribution'],
      });

      if (!channel) {
        throw new Error('Failed to create channel');
      }

      console.log('✅ Channel created with both supply and distribution roles');

      // Step 3: Create a store that references the channel for both distribution and supply
      console.log('🏪 Step 3: Creating store...');
      const storeKey = `${companyKey}-store`;
      const store = await storeManagement.createStore({
        key: storeKey,
        name: [
          {
            locale: 'en-US',
            value: `${companyName} Store`,
          },
        ],
        distributionChannels: [
          {
            typeId: 'channel',
            key: channelKey,
          },
        ],
        supplyChannels: [
          {
            typeId: 'channel',
            key: channelKey,
          },
        ],
      });

      if (!store) {
        throw new Error('Failed to create store');
      }

      console.log('✅ Store created with distribution and supply channels');

      // Step 4: Create product selection and assign to store
      console.log('📦 Step 4: Creating product selection...');
      const productSelectionKey = `${companyKey}-selection`;
      const productSelection = await storeManagement.createProductSelection(
        {
          key: productSelectionKey,
          name: [
            {
              locale: 'en-US',
              value: `${companyName} Selection`,
            },
          ],
          mode: 'Individual',
        },
        storeKey
      );

      if (!productSelection) {
        throw new Error('Failed to create product selection');
      }

      console.log('✅ Product selection created and assigned to store');

      // Step 5: Create business unit with associate and store references
      console.log('🏢 Step 5: Creating business unit...');
      const associateRoleKey = environment?.ASSOCIATE_ROLE;

      if (!associateRoleKey) {
        throw new Error('ASSOCIATE_ROLE environment variable is not set');
      }

      const businessUnit = await businessUnitManagement.createBusinessUnit({
        key: companyKey,
        name: companyName,
        unitType: 'Company',
        contactEmail: values.email,
        addresses: values.phoneNumber
          ? [
              {
                key: `${companyKey}-address`,
                country: 'US',
                firstName: values.firstName,
                lastName: values.lastName,
                company: companyName,
                phone: values.phoneNumber,
              },
            ]
          : undefined,
        associates: [
          {
            customer: {
              typeId: 'customer',
              id: customer.id,
            },
            associateRoleAssignments: [
              {
                associateRole: {
                  typeId: 'associate-role',
                  key: associateRoleKey,
                },
              },
            ],
          },
        ],
        stores: [
          {
            typeId: 'store',
            key: storeKey,
          },
        ],
        storeMode: 'Explicit',
      });

      if (!businessUnit) {
        throw new Error('Failed to create business unit');
      }

      console.log('✅ Business unit created with store assignment');

      // Step 6: Create Merchant Center invitation
      console.log('📨 Step 6: Creating Merchant Center invitation...');
      const invitationSuccess =
        await merchantCenterManagement.inviteSellerToMerchantCenter(
          values.email
        );

      if (invitationSuccess) {
        console.log('✅ Merchant Center invitation sent successfully');
        // Show success notification for invitation
        showNotification({
          kind: NOTIFICATION_KINDS_SIDE.success,
          domain: 'side',
          text: intl.formatMessage(messages.invitationSent),
        });
      } else {
        console.warn(
          '⚠️ Merchant Center invitation failed, but continuing with onboarding'
        );
        // Show warning notification for invitation failure
        showNotification({
          kind: NOTIFICATION_KINDS_SIDE.warning,
          domain: 'side',
          text: intl.formatMessage(messages.invitationFailed),
        });
      }

      // 🎉 Final Summary
      console.log('🎉 === ONBOARD SELLER COMPLETE ===');
      console.log('📊 Summary:');
      console.log(
        `👤 Seller: ${customer.firstName} ${customer.lastName} (${customer.email})`
      );
      console.log(
        `🏢 Business Unit: ${businessUnit.name} (${businessUnit.key})`
      );
      console.log(`📺 Channel: ${channel.key} [${channel.roles.join(', ')}]`);
      console.log(`🏪 Store: ${store.key} (Distribution + Supply)`);
      console.log(`📦 Product Selection: ${productSelection.key}`);
      console.log(
        `📨 Merchant Center Invitation: ${
          invitationSuccess ? 'Sent ✅' : 'Failed ⚠️'
        }`
      );
      console.log('🔗 All resources created and linked successfully!');

      // Success notification for overall onboarding
      showNotification({
        kind: NOTIFICATION_KINDS_SIDE.success,
        domain: 'side',
        text: intl.formatMessage(
          {
            id: 'OnboardSeller.success',
            defaultMessage: 'Seller {name} has been successfully onboarded!',
          },
          { name: `${values.firstName} ${values.lastName}` }
        ),
      });

      // Navigate back to dashboard
      history.push('/');
    } catch (error) {
      console.error(
        '❌ Onboarding failed:',
        error instanceof Error ? error.message : 'Unknown error'
      );

      // Error notification
      showNotification({
        kind: NOTIFICATION_KINDS_SIDE.error,
        domain: 'side',
        text: intl.formatMessage({
          id: 'OnboardSeller.error.general',
          defaultMessage: 'Failed to onboard seller. Please try again.',
        }),
      });
    }
  };

  const renderError = (key: string) => {
    switch (key) {
      case 'missing':
        return intl.formatMessage({
          id: 'OnboardSeller.error.missing',
          defaultMessage: 'This field is required',
        });
      case 'invalid':
        return intl.formatMessage({
          id: 'OnboardSeller.error.invalid',
          defaultMessage: 'This field is invalid',
        });
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <Text.Headline as="h1">
            {intl.formatMessage(messages.title)}
          </Text.Headline>
          <Text.Detail>{intl.formatMessage(messages.subtitle)}</Text.Detail>
        </div>
        <div className={styles.actionButtons}>
          <PrimaryButton
            label={intl.formatMessage(messages.backToAdmin)}
            onClick={handleBackToDashboard}
            isDisabled={isLoading}
          />
        </div>
      </div>

      <div className={styles.formContainer}>
        <Card className={styles.formCard}>
          <Spacings.Stack scale="l">
            <Formik
              initialValues={{
                companyName: '',
                firstName: '',
                lastName: '',
                email: '',
                phoneNumber: '',
              }}
              validate={validate}
              onSubmit={handleSubmit}
            >
              {(formikProps) => (
                <form onSubmit={formikProps.handleSubmit}>
                  <Spacings.Stack scale="m">
                    <TextField
                      name="companyName"
                      value={formikProps.values.companyName}
                      onChange={formikProps.handleChange}
                      onBlur={formikProps.handleBlur}
                      title={intl.formatMessage(messages.companyName)}
                      errors={
                        formikProps.errors
                          .companyName as unknown as TFieldErrors
                      }
                      touched={formikProps.touched.companyName}
                      renderError={renderError}
                      horizontalConstraint={16}
                      isRequired
                    />

                    <TextField
                      name="firstName"
                      value={formikProps.values.firstName}
                      onChange={formikProps.handleChange}
                      onBlur={formikProps.handleBlur}
                      title={intl.formatMessage(messages.firstName)}
                      errors={
                        formikProps.errors.firstName as unknown as TFieldErrors
                      }
                      touched={formikProps.touched.firstName}
                      renderError={renderError}
                      horizontalConstraint={16}
                      isRequired
                    />

                    <TextField
                      name="lastName"
                      value={formikProps.values.lastName}
                      onChange={formikProps.handleChange}
                      onBlur={formikProps.handleBlur}
                      title={intl.formatMessage(messages.lastName)}
                      errors={
                        formikProps.errors.lastName as unknown as TFieldErrors
                      }
                      touched={formikProps.touched.lastName}
                      renderError={renderError}
                      horizontalConstraint={16}
                      isRequired
                    />

                    <TextField
                      name="email"
                      value={formikProps.values.email}
                      onChange={formikProps.handleChange}
                      onBlur={formikProps.handleBlur}
                      title={intl.formatMessage(messages.email)}
                      errors={
                        formikProps.errors.email as unknown as TFieldErrors
                      }
                      touched={formikProps.touched.email}
                      renderError={renderError}
                      horizontalConstraint={16}
                      isRequired
                    />

                    <TextField
                      name="phoneNumber"
                      value={formikProps.values.phoneNumber}
                      onChange={formikProps.handleChange}
                      onBlur={formikProps.handleBlur}
                      title={intl.formatMessage(messages.phoneNumber)}
                      errors={
                        formikProps.errors
                          .phoneNumber as unknown as TFieldErrors
                      }
                      touched={formikProps.touched.phoneNumber}
                      renderError={renderError}
                      horizontalConstraint={16}
                    />

                    <div className={styles.buttonsContainer}>
                      <PrimaryButton
                        label={intl.formatMessage(messages.submit)}
                        type="submit"
                        isDisabled={formikProps.isSubmitting || isLoading}
                        size="20"
                      />
                    </div>
                  </Spacings.Stack>
                </form>
              )}
            </Formik>
          </Spacings.Stack>
        </Card>
      </div>
    </div>
  );
};

export default OnboardSeller;
