import React from 'react';
import { useHistory } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { Formik } from 'formik';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import TextField from '@commercetools-uikit/text-field';
import SelectField from '@commercetools-uikit/select-field';
import CheckboxInput from '@commercetools-uikit/checkbox-input';
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
  // Clinic Info
  clinicName: string;
  websiteUrl: string;
  practiceType: string;
  // Contact Info
  address: string;
  city: string;
  zipCode: string;
  state: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryPhoneNumber: string;
  primaryPhoneSms: boolean;
  secondaryContactName: string;
  secondaryContactEmail: string;
  secondaryPhoneNumber: string;
  secondaryPhoneSms: boolean;
  prescriptionEmail: string;
  faxNumber: string;
  billingPhoneNumber: string;
  billingPhoneSms: boolean;
  // Billing Info
  taxId: string;
  debtorNumber: string;
  resellerCertificate: string;
  // Social Network Links
  facebook: string;
  instagram: string;
  youtube: string;
  linkedin: string;
  x: string;
};

type TFieldErrors = Record<string, boolean>;

type TFormErrors = {
  clinicName?: TFieldErrors;
  websiteUrl?: TFieldErrors;
  practiceType?: TFieldErrors;
  address?: TFieldErrors;
  city?: TFieldErrors;
  zipCode?: TFieldErrors;
  state?: TFieldErrors;
  primaryContactName?: TFieldErrors;
  primaryContactEmail?: TFieldErrors;
  primaryPhoneNumber?: TFieldErrors;
  secondaryContactName?: TFieldErrors;
  secondaryContactEmail?: TFieldErrors;
  secondaryPhoneNumber?: TFieldErrors;
  prescriptionEmail?: TFieldErrors;
  faxNumber?: TFieldErrors;
  billingPhoneNumber?: TFieldErrors;
  taxId?: TFieldErrors;
  debtorNumber?: TFieldErrors;
  resellerCertificate?: TFieldErrors;
  facebook?: TFieldErrors;
  instagram?: TFieldErrors;
  youtube?: TFieldErrors;
  linkedin?: TFieldErrors;
  x?: TFieldErrors;
};

const validate = (values: TFormValues): TFormErrors => {
  const errors: TFormErrors = {};

  // Required field validation - Clinic Info
  if (!values.clinicName?.trim()) {
    errors.clinicName = { missing: true };
  }

  // Email validation - only validate format if email is provided
  if (
    values.primaryContactEmail &&
    values.primaryContactEmail.trim() !== '' &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.primaryContactEmail)
  ) {
    errors.primaryContactEmail = { invalid: true };
  }

  if (
    values.secondaryContactEmail &&
    values.secondaryContactEmail.trim() !== '' &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.secondaryContactEmail)
  ) {
    errors.secondaryContactEmail = { invalid: true };
  }

  if (
    values.prescriptionEmail &&
    values.prescriptionEmail.trim() !== '' &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.prescriptionEmail)
  ) {
    errors.prescriptionEmail = { invalid: true };
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
  }: {
    environment: {
      CUSTOMER_GROUP: string;
      ASSOCIATE_ROLE: string;
      MC_TEAM_NAME: string;
    };
  } = useApplicationContext();

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

      // Step 2: Create a store
      console.log('🏪 Step 2: Creating store...');
      const storeKey = `${companyKey}-store`;
      const store = await storeManagement.createStore({
        key: storeKey,
        name: [
          {
            locale: 'en-US',
            value: `${companyName} Store`,
          },
        ],
      });

      if (!store) {
        throw new Error('Failed to create store');
      }

      console.log('✅ Store created');

      // Step 3: Create product selection and assign to store
      console.log('📦 Step 3: Creating product selection...');
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
          mode: 'IndividualExclusion',
        },
        storeKey
      );

      if (!productSelection) {
        throw new Error('Failed to create product selection');
      }

      console.log('✅ Product selection created and assigned to store');

      // Step 4: Create business unit with associate and store references
      console.log('🏢 Step 4: Creating business unit...');
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

      // Step 5: Create Merchant Center invitation
      console.log('📨 Step 5: Creating Merchant Center invitation...');
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
      console.log(`🏪 Store: ${store.key}`);
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
                clinicName: '',
                websiteUrl: '',
                practiceType: '',
                address: '',
                city: '',
                zipCode: '',
                state: '',
                primaryContactName: '',
                primaryContactEmail: '',
                primaryPhoneNumber: '',
                primaryPhoneSms: false,
                secondaryContactName: '',
                secondaryContactEmail: '',
                secondaryPhoneNumber: '',
                secondaryPhoneSms: false,
                prescriptionEmail: '',
                faxNumber: '',
                billingPhoneNumber: '',
                billingPhoneSms: false,
                taxId: '',
                debtorNumber: '',
                resellerCertificate: '',
                facebook: '',
                instagram: '',
                youtube: '',
                linkedin: '',
                x: '',
              }}
              validate={validate}
              onSubmit={handleSubmit}
            >
              {(formikProps) => (
                <form onSubmit={formikProps.handleSubmit}>
                  <Spacings.Stack scale="l">
                    {/* Clinic Info Section */}
                    <Spacings.Stack scale="m">
                      <Text.Headline as="h3">Clinic Info</Text.Headline>
                      <TextField
                        name="clinicName"
                        value={formikProps.values.clinicName}
                        onChange={formikProps.handleChange}
                        onBlur={formikProps.handleBlur}
                        title={intl.formatMessage(messages.clinicName)}
                        errors={formikProps.errors.clinicName as unknown as TFieldErrors}
                        touched={formikProps.touched.clinicName}
                        renderError={renderError}
                        horizontalConstraint={16}
                        isRequired
                      />
                      <div className={styles.formRow}>
                        <TextField
                          name="websiteUrl"
                          value={formikProps.values.websiteUrl}
                          onChange={formikProps.handleChange}
                          onBlur={formikProps.handleBlur}
                          title={intl.formatMessage(messages.websiteUrl)}
                          errors={formikProps.errors.websiteUrl as unknown as TFieldErrors}
                          touched={formikProps.touched.websiteUrl}
                          renderError={renderError}
                          horizontalConstraint={16}
                        />
                        <SelectField
                          name="practiceType"
                          value={formikProps.values.practiceType}
                          onChange={formikProps.handleChange}
                          onBlur={formikProps.handleBlur}
                          title={intl.formatMessage(messages.practiceType)}
                          errors={formikProps.errors.practiceType as unknown as TFieldErrors}
                          touched={formikProps.touched.practiceType}
                          renderError={renderError}
                          horizontalConstraint={16}
                          options={[
                            { value: 'small-animal', label: 'Small Animal' },
                            { value: 'large-animal', label: 'Large Animal' },
                            { value: 'mixed', label: 'Mixed' },
                            { value: 'exotic', label: 'Exotic' },
                          ]}
                        />
                      </div>
                    </Spacings.Stack>

                    {/* Contact Info Section */}
                    <Spacings.Stack scale="m">
                      <Text.Headline as="h3">Contact Info</Text.Headline>
                      <TextField
                        name="address"
                        value={formikProps.values.address}
                        onChange={formikProps.handleChange}
                        onBlur={formikProps.handleBlur}
                        title={intl.formatMessage(messages.address)}
                        errors={formikProps.errors.address as unknown as TFieldErrors}
                        touched={formikProps.touched.address}
                        renderError={renderError}
                        horizontalConstraint={16}
                      />
                      <div className={styles.formRowThreeColumns}>
                        <TextField
                          name="city"
                          value={formikProps.values.city}
                          onChange={formikProps.handleChange}
                          onBlur={formikProps.handleBlur}
                          title={intl.formatMessage(messages.city)}
                          errors={formikProps.errors.city as unknown as TFieldErrors}
                          touched={formikProps.touched.city}
                          renderError={renderError}
                          horizontalConstraint={16}
                        />
                        <TextField
                          name="zipCode"
                          value={formikProps.values.zipCode}
                          onChange={formikProps.handleChange}
                          onBlur={formikProps.handleBlur}
                          title={intl.formatMessage(messages.zipCode)}
                          errors={formikProps.errors.zipCode as unknown as TFieldErrors}
                          touched={formikProps.touched.zipCode}
                          renderError={renderError}
                          horizontalConstraint={16}
                        />
                        <SelectField
                          name="state"
                          value={formikProps.values.state}
                          onChange={formikProps.handleChange}
                          onBlur={formikProps.handleBlur}
                          title={intl.formatMessage(messages.state)}
                          errors={formikProps.errors.state as unknown as TFieldErrors}
                          touched={formikProps.touched.state}
                          renderError={renderError}
                          horizontalConstraint={16}
                          options={[
                            { value: 'AL', label: 'AL' },
                            { value: 'AK', label: 'AK' },
                            { value: 'AZ', label: 'AZ' },
                            { value: 'AR', label: 'AR' },
                            { value: 'CA', label: 'CA' },
                            { value: 'CO', label: 'CO' },
                            { value: 'CT', label: 'CT' },
                            { value: 'DE', label: 'DE' },
                            { value: 'FL', label: 'FL' },
                            { value: 'GA', label: 'GA' },
                            { value: 'HI', label: 'HI' },
                            { value: 'ID', label: 'ID' },
                            { value: 'IL', label: 'IL' },
                            { value: 'IN', label: 'IN' },
                            { value: 'IA', label: 'IA' },
                            { value: 'KS', label: 'KS' },
                            { value: 'KY', label: 'KY' },
                            { value: 'LA', label: 'LA' },
                            { value: 'ME', label: 'ME' },
                            { value: 'MD', label: 'MD' },
                            { value: 'MA', label: 'MA' },
                            { value: 'MI', label: 'MI' },
                            { value: 'MN', label: 'MN' },
                            { value: 'MS', label: 'MS' },
                            { value: 'MO', label: 'MO' },
                            { value: 'MT', label: 'MT' },
                            { value: 'NE', label: 'NE' },
                            { value: 'NV', label: 'NV' },
                            { value: 'NH', label: 'NH' },
                            { value: 'NJ', label: 'NJ' },
                            { value: 'NM', label: 'NM' },
                            { value: 'NY', label: 'NY' },
                            { value: 'NC', label: 'NC' },
                            { value: 'ND', label: 'ND' },
                            { value: 'OH', label: 'OH' },
                            { value: 'OK', label: 'OK' },
                            { value: 'OR', label: 'OR' },
                            { value: 'PA', label: 'PA' },
                            { value: 'RI', label: 'RI' },
                            { value: 'SC', label: 'SC' },
                            { value: 'SD', label: 'SD' },
                            { value: 'TN', label: 'TN' },
                            { value: 'TX', label: 'TX' },
                            { value: 'UT', label: 'UT' },
                            { value: 'VT', label: 'VT' },
                            { value: 'VA', label: 'VA' },
                            { value: 'WA', label: 'WA' },
                            { value: 'WV', label: 'WV' },
                            { value: 'WI', label: 'WI' },
                            { value: 'WY', label: 'WY' },
                          ]}
                        />
                      </div>
                      <div className={styles.formRowThreeColumns}>
                        <TextField
                          name="primaryContactName"
                          value={formikProps.values.primaryContactName}
                          onChange={formikProps.handleChange}
                          onBlur={formikProps.handleBlur}
                          title={intl.formatMessage(messages.primaryContactName)}
                          errors={formikProps.errors.primaryContactName as unknown as TFieldErrors}
                          touched={formikProps.touched.primaryContactName}
                          renderError={renderError}
                          horizontalConstraint={16}
                        />
                        <TextField
                          name="primaryContactEmail"
                          value={formikProps.values.primaryContactEmail}
                          onChange={formikProps.handleChange}
                          onBlur={formikProps.handleBlur}
                          title={intl.formatMessage(messages.primaryContactEmail)}
                          errors={formikProps.errors.primaryContactEmail as unknown as TFieldErrors}
                          touched={formikProps.touched.primaryContactEmail}
                          renderError={renderError}
                          horizontalConstraint={16}
                        />
                        <div className={styles.phoneFieldWithSms}>
                          <TextField
                            name="primaryPhoneNumber"
                            value={formikProps.values.primaryPhoneNumber}
                            onChange={formikProps.handleChange}
                            onBlur={formikProps.handleBlur}
                            title={intl.formatMessage(messages.primaryPhoneNumber)}
                            errors={formikProps.errors.primaryPhoneNumber as unknown as TFieldErrors}
                            touched={formikProps.touched.primaryPhoneNumber}
                            renderError={renderError}
                            horizontalConstraint={16}
                          />
                          <div className={styles.smsCheckbox}>
                            <CheckboxInput
                              isChecked={formikProps.values.primaryPhoneSms}
                              onChange={(e) => formikProps.setFieldValue('primaryPhoneSms', e.target.checked)}
                            >
                              Enable SMS
                            </CheckboxInput>
                          </div>
                        </div>
                      </div>
                      <div className={styles.formRowThreeColumns}>
                        <TextField
                          name="secondaryContactName"
                          value={formikProps.values.secondaryContactName}
                          onChange={formikProps.handleChange}
                          onBlur={formikProps.handleBlur}
                          title={intl.formatMessage(messages.secondaryContactName)}
                          errors={formikProps.errors.secondaryContactName as unknown as TFieldErrors}
                          touched={formikProps.touched.secondaryContactName}
                          renderError={renderError}
                          horizontalConstraint={16}
                        />
                        <TextField
                          name="secondaryContactEmail"
                          value={formikProps.values.secondaryContactEmail}
                          onChange={formikProps.handleChange}
                          onBlur={formikProps.handleBlur}
                          title={intl.formatMessage(messages.secondaryContactEmail)}
                          errors={formikProps.errors.secondaryContactEmail as unknown as TFieldErrors}
                          touched={formikProps.touched.secondaryContactEmail}
                          renderError={renderError}
                          horizontalConstraint={16}
                        />
                        <div className={styles.phoneFieldWithSms}>
                          <TextField
                            name="secondaryPhoneNumber"
                            value={formikProps.values.secondaryPhoneNumber}
                            onChange={formikProps.handleChange}
                            onBlur={formikProps.handleBlur}
                            title={intl.formatMessage(messages.secondaryPhoneNumber)}
                            errors={formikProps.errors.secondaryPhoneNumber as unknown as TFieldErrors}
                            touched={formikProps.touched.secondaryPhoneNumber}
                            renderError={renderError}
                            horizontalConstraint={16}
                          />
                          <div className={styles.smsCheckbox}>
                            <CheckboxInput
                              isChecked={formikProps.values.secondaryPhoneSms}
                              onChange={(e) => formikProps.setFieldValue('secondaryPhoneSms', e.target.checked)}
                            >
                              Enable SMS
                            </CheckboxInput>
                          </div>
                        </div>
                      </div>
                      <div className={styles.formRowThreeColumns}>
                        <TextField
                          name="prescriptionEmail"
                          value={formikProps.values.prescriptionEmail}
                          onChange={formikProps.handleChange}
                          onBlur={formikProps.handleBlur}
                          title={intl.formatMessage(messages.prescriptionEmail)}
                          errors={formikProps.errors.prescriptionEmail as unknown as TFieldErrors}
                          touched={formikProps.touched.prescriptionEmail}
                          renderError={renderError}
                          horizontalConstraint={16}
                        />
                        <TextField
                          name="faxNumber"
                          value={formikProps.values.faxNumber}
                          onChange={formikProps.handleChange}
                          onBlur={formikProps.handleBlur}
                          title={intl.formatMessage(messages.faxNumber)}
                          errors={formikProps.errors.faxNumber as unknown as TFieldErrors}
                          touched={formikProps.touched.faxNumber}
                          renderError={renderError}
                          horizontalConstraint={16}
                        />
                        <div className={styles.phoneFieldWithSms}>
                          <TextField
                            name="billingPhoneNumber"
                            value={formikProps.values.billingPhoneNumber}
                            onChange={formikProps.handleChange}
                            onBlur={formikProps.handleBlur}
                            title={intl.formatMessage(messages.billingPhoneNumber)}
                            errors={formikProps.errors.billingPhoneNumber as unknown as TFieldErrors}
                            touched={formikProps.touched.billingPhoneNumber}
                            renderError={renderError}
                            horizontalConstraint={16}
                          />
                          <div className={styles.smsCheckbox}>
                            <CheckboxInput
                              isChecked={formikProps.values.billingPhoneSms}
                              onChange={(e) => formikProps.setFieldValue('billingPhoneSms', e.target.checked)}
                            >
                              Enable SMS
                            </CheckboxInput>
                          </div>
                        </div>
                      </div>
                    </Spacings.Stack>

                    {/* Billing Info Section */}
                    <Spacings.Stack scale="m">
                      <Text.Headline as="h3">Billing Info</Text.Headline>
                      <TextField
                        name="taxId"
                        value={formikProps.values.taxId}
                        onChange={formikProps.handleChange}
                        onBlur={formikProps.handleBlur}
                        title={intl.formatMessage(messages.taxId)}
                        errors={formikProps.errors.taxId as unknown as TFieldErrors}
                        touched={formikProps.touched.taxId}
                        renderError={renderError}
                        horizontalConstraint={16}
                      />
                      <TextField
                        name="debtorNumber"
                        value={formikProps.values.debtorNumber}
                        onChange={formikProps.handleChange}
                        onBlur={formikProps.handleBlur}
                        title={intl.formatMessage(messages.debtorNumber)}
                        errors={formikProps.errors.debtorNumber as unknown as TFieldErrors}
                        touched={formikProps.touched.debtorNumber}
                        renderError={renderError}
                        horizontalConstraint={16}
                      />
                      <TextField
                        name="resellerCertificate"
                        value={formikProps.values.resellerCertificate}
                        onChange={formikProps.handleChange}
                        onBlur={formikProps.handleBlur}
                        title={intl.formatMessage(messages.resellerCertificate)}
                        errors={formikProps.errors.resellerCertificate as unknown as TFieldErrors}
                        touched={formikProps.touched.resellerCertificate}
                        renderError={renderError}
                        horizontalConstraint={16}
                      />
                    </Spacings.Stack>

                    {/* Social Network Links Section */}
                    <Spacings.Stack scale="m">
                      <Text.Headline as="h3">Social Network Links</Text.Headline>
                      <TextField
                        name="facebook"
                        value={formikProps.values.facebook}
                        onChange={formikProps.handleChange}
                        onBlur={formikProps.handleBlur}
                        title={intl.formatMessage(messages.facebook)}
                        errors={formikProps.errors.facebook as unknown as TFieldErrors}
                        touched={formikProps.touched.facebook}
                        renderError={renderError}
                        horizontalConstraint={16}
                      />
                      <TextField
                        name="instagram"
                        value={formikProps.values.instagram}
                        onChange={formikProps.handleChange}
                        onBlur={formikProps.handleBlur}
                        title={intl.formatMessage(messages.instagram)}
                        errors={formikProps.errors.instagram as unknown as TFieldErrors}
                        touched={formikProps.touched.instagram}
                        renderError={renderError}
                        horizontalConstraint={16}
                      />
                      <TextField
                        name="youtube"
                        value={formikProps.values.youtube}
                        onChange={formikProps.handleChange}
                        onBlur={formikProps.handleBlur}
                        title={intl.formatMessage(messages.youtube)}
                        errors={formikProps.errors.youtube as unknown as TFieldErrors}
                        touched={formikProps.touched.youtube}
                        renderError={renderError}
                        horizontalConstraint={16}
                      />
                      <TextField
                        name="linkedin"
                        value={formikProps.values.linkedin}
                        onChange={formikProps.handleChange}
                        onBlur={formikProps.handleBlur}
                        title={intl.formatMessage(messages.linkedin)}
                        errors={formikProps.errors.linkedin as unknown as TFieldErrors}
                        touched={formikProps.touched.linkedin}
                        renderError={renderError}
                        horizontalConstraint={16}
                      />
                      <TextField
                        name="x"
                        value={formikProps.values.x}
                        onChange={formikProps.handleChange}
                        onBlur={formikProps.handleBlur}
                        title={intl.formatMessage(messages.x)}
                        errors={formikProps.errors.x as unknown as TFieldErrors}
                        touched={formikProps.touched.x}
                        renderError={renderError}
                        horizontalConstraint={16}
                      />
                    </Spacings.Stack>

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
