import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import AsyncSelectField from '@commercetools-uikit/async-select-field';
import Card from '@commercetools-uikit/card';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import MoneyInput from '@commercetools-uikit/money-input';
import { ContentNotification } from '@commercetools-uikit/notifications';
import PrimaryButton from '@commercetools-uikit/primary-button';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import TextField from '@commercetools-uikit/text-field';
import { ProductDraft } from '@commercetools/platform-sdk';
import React, { useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { v4 as uuidv4 } from 'uuid';
import { useAuthContext } from '../../contexts/auth-context';
import { useProductTypeConnector } from '../../hooks/use-product-type-connector';
import { ProductFormData } from '../product/details';
import messages from './messages';
import styles from './products.module.css';
import { Formik, FormikErrors } from 'formik';

interface ProductFormProps {
  initialData?: ProductFormData;
  onBack: () => void;
  onSubmit: (data: ProductDraft) => void;
  isEdit?: boolean;
  isCreate?: boolean;
}

// Product type definition (from provided JSON)

// Product data structure
const defaultFormData: ProductFormData = {
  name: '',
  description: '',
  sku: '',
  price: {
    currencyCode: 'USD',
    amount: '0',
  },
  imageUrl: '',
  imageLabel: 'Product Image',
  productType: {
    id: '',
    typeId: 'product-type',
  },
};

const ProductForm: React.FC<ProductFormProps> = ({
  onSubmit,
  initialData,
  isCreate,
  isEdit,
}) => {
  const intl = useIntl();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { dataLocale = 'en-US' } = useApplicationContext();
  const { distributionChannelId } = useAuthContext();
  const { getProductTypes } = useProductTypeConnector();

  const [productTypes, setProductTypes] = useState<
    { label: string; value: string }[]
  >([]);

  const fetchProductTypes = async () => {
    const productTypes = await getProductTypes();
    return productTypes.map((productType) => ({
      label: productType.name,
      value: productType.id,
    }));
  };

  // Form validation
  const isFormValid = (values: ProductFormData) => {
    const errors: FormikErrors<ProductFormData> = {};

    if (!values.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!values.sku.trim()) {
      errors.sku = 'SKU is required';
    }

    if (!values.price.amount) {
      // @ts-ignore
      errors.price = 'Price is required';
    }

    if (!values.productType.id) {
      // @ts-ignore
      errors.productType = 'Product type is required';
    }

    return errors;
  };

  // Handle form submission
  const handleSubmit = async (values: ProductFormData) => {
    setError(null);
    setSuccessMessage(null);

    try {
      // Generate a unique slug
      const slug = `product_slug_${uuidv4()}`;

      // Convert price to cent amount (multiply by 100)
      const priceValue = MoneyInput.convertToMoneyValue(
        values.price,
        dataLocale || 'en-US'
      );

      // Construct the product draft
      const productDraft: ProductDraft = {
        productType: values.productType,
        name: {
          [dataLocale || 'en-US']: values.name,
        },
        description: {
          [dataLocale || 'en-US']: values.description || ' ',
        },
        slug: {
          [dataLocale || 'en-US']: slug,
        },
        masterVariant: {
          sku: values.sku,
          prices: [
            {
              value: priceValue!,
              channel: {
                typeId: 'channel',
                id: distributionChannelId!,
              },
            },
          ],
          images: values.imageUrl
            ? [
                {
                  url: values.imageUrl,
                  label: 'Product Image',
                  dimensions: {
                    w: 500,
                    h: 500,
                  },
                },
              ]
            : [],
        },
        variants: [],
        publish: true,
      };

      // Call the onSubmit callback
      await onSubmit(productDraft);

      // Show success message
      setSuccessMessage(intl.formatMessage(messages.productCreateSuccess));
    } catch (err) {
      console.error('Error creating product:', err);
      setError(
        err instanceof Error ? err.message : 'Unknown error creating product'
      );
    }
  };

  const getProductTypeValue = (values: ProductFormData) => {
    const productTypeFound = productTypes.find(
      (productType) => productType.value === values.productType.id
    );
    return {
      label: productTypeFound?.label,
      value: productTypeFound?.value,
    };
  };

  useEffect(() => {
    fetchProductTypes().then((productTypes) => {
      setProductTypes(productTypes);
    });
  }, []);

  return (
    <Formik<ProductFormData>
      initialValues={initialData || defaultFormData}
      onSubmit={handleSubmit}
      enableReinitialize
      validate={isFormValid}
    >
      {({
        values,
        errors,
        touched,
        handleChange,
        setFieldValue,
        handleBlur,
        handleSubmit,
        isSubmitting,
        /* and other goodies */
      }) => (
        <form className={styles.container}>
          <Spacings.Stack scale="l">
            {successMessage && (
              <ContentNotification type="success">
                <Text.Body>{successMessage}</Text.Body>
              </ContentNotification>
            )}

            {error && (
              <ContentNotification type="error">
                <Text.Body>{error}</Text.Body>
              </ContentNotification>
            )}

            <Card>
              <Spacings.Stack scale="m">
                <div className={styles.sectionTitle}>
                  <Text.Subheadline as="h4">
                    {intl.formatMessage(messages.productBasicInfo)}
                  </Text.Subheadline>
                </div>

                <Spacings.Stack scale="s">
                  <AsyncSelectField
                    title={intl.formatMessage(messages.productType)}
                    name="productType"
                    value={getProductTypeValue(values)}
                    onChange={(event) =>
                      setFieldValue(
                        'productType',
                        {
                          id: (event.target.value as { value: string }).value,
                          typeId: 'product-type',
                        },
                        true
                      )
                    }
                    isReadOnly={!isCreate}
                    isRequired
                    defaultOptions={productTypes}
                    loadOptions={fetchProductTypes}
                  />
                </Spacings.Stack>
              </Spacings.Stack>
            </Card>

            <Card>
              <Spacings.Stack scale="m">
                <div className={styles.sectionTitle}>
                  <Text.Subheadline as="h4">
                    {intl.formatMessage(messages.productBasicInfo)}
                  </Text.Subheadline>
                </div>

                <Spacings.Stack scale="s">
                  <TextField
                    title={intl.formatMessage(messages.productName)}
                    name="name"
                    value={values.name}
                    onChange={handleChange}
                    isRequired
                    horizontalConstraint="scale"
                  />

                  <TextField
                    title={intl.formatMessage(messages.productDescription)}
                    name="description"
                    value={values.description}
                    onChange={handleChange}
                    horizontalConstraint="scale"
                  />
                </Spacings.Stack>
              </Spacings.Stack>
            </Card>

            <Card>
              <Spacings.Stack scale="m">
                <div className={styles.sectionTitle}>
                  <Text.Subheadline as="h4">
                    {intl.formatMessage(messages.masterVariant)}
                  </Text.Subheadline>
                </div>

                <Spacings.Stack scale="s">
                  <TextField
                    title={intl.formatMessage(messages.variantSku)}
                    name="sku"
                    value={values.sku}
                    onChange={handleChange}
                    isRequired
                    isReadOnly={!isCreate}
                    horizontalConstraint="scale"
                  />

                  <Spacings.Stack scale="xs">
                    <Text.Subheadline as="h4">
                      {intl.formatMessage(messages.price)}
                    </Text.Subheadline>
                    <MoneyInput
                      name="price"
                      isReadOnly={!isCreate}
                      value={values.price}
                      onChange={handleChange}
                    />
                    <Text.Detail tone="secondary">
                      {intl.formatMessage(messages.priceHint)}
                    </Text.Detail>
                  </Spacings.Stack>
                </Spacings.Stack>
              </Spacings.Stack>
            </Card>

            <Card>
              <Spacings.Stack scale="m">
                <div className={styles.sectionTitle}>
                  <Text.Subheadline as="h4">
                    {intl.formatMessage(messages.productImage)}
                  </Text.Subheadline>
                </div>

                <Spacings.Stack scale="s">
                  <TextField
                    title={intl.formatMessage(messages.imageUrl)}
                    name="imageUrl"
                    value={values.imageUrl}
                    onChange={handleChange}
                    horizontalConstraint="scale"
                  />

                  <TextField
                    title={intl.formatMessage(messages.imageLabel)}
                    name="imageLabel"
                    value={values.imageLabel}
                    onChange={handleChange}
                    horizontalConstraint="scale"
                  />

                  {values.imageUrl && (
                    <div className={styles.imagePreviewContainer}>
                      <Text.Detail tone="secondary">
                        {intl.formatMessage(messages.imagePreview)}
                      </Text.Detail>
                      <div className={styles.imagePreview}>
                        <img
                          src={values.imageUrl}
                          alt={values.imageLabel}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src =
                              'https://via.placeholder.com/150?text=Invalid+Image+URL';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </Spacings.Stack>
              </Spacings.Stack>
            </Card>

            <Spacings.Inline justifyContent="flex-end">
              <PrimaryButton
                label={intl.formatMessage(
                  isCreate
                    ? messages.createProductButton
                    : messages.updateProductButton
                )}
                onClick={() => handleSubmit()}
              />
            </Spacings.Inline>

            {isSubmitting && (
              <div className={styles.loadingOverlay}>
                <LoadingSpinner scale="l" />
              </div>
            )}
          </Spacings.Stack>
        </form>
      )}
    </Formik>
  );
};

export default ProductForm;
