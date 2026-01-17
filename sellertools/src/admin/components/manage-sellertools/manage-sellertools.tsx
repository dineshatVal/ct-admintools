import React, { useEffect, useState } from 'react';
import messages from './messages';
import styles from './manage-sellers.module.css';
import Text from '@commercetools-uikit/text';
import { useIntl } from 'react-intl';
import PrimaryButton from '@commercetools-uikit/primary-button';
import { useHistory } from 'react-router-dom';
import Card from '@commercetools-uikit/card';
import Spacings from '@commercetools-uikit/spacings';
import { Formik } from 'formik';
import SelectField from '@commercetools-uikit/select-field';
import { useCustomObject } from '../../hooks/use-custom-objects';
import useCustomerGroups from '../../hooks/use-customer-groups/use-customer-details';
import useProductSelections from '../../hooks/use-product-selection/use-product-selection';
import useStoreManagement, { Store } from '../../hooks/use-store-management';

type TFormValues = {
  sellerCustomerGroupID: string;
  mainCatalogProductSelectionID: string;
  storeKey: string;
};
type TFieldErrors = Record<string, boolean>;

type TFormErrors = Record<string, TFieldErrors>;

const ManageSellertools = () => {
  const intl = useIntl();
  const history = useHistory();
  const {
    getSelectedCustomerGroup,
    getSelectedProductSelection,
    getSelectedStore,
    setSellertoolsContext,
  } = useCustomObject();
  const [stores, setStores] = useState<Store[]>([]);
  const [initialValues, setInitialValues] = useState<TFormValues>({
    sellerCustomerGroupID: '',
    mainCatalogProductSelectionID: '',
    storeKey: '',
  });
  const { customerGroups, loading: customerGroupsLoading } =
    useCustomerGroups();
  const { productSelections, loading: productSelectionsLoading } =
    useProductSelections();
  const { findStores, loading: storesLoading } = useStoreManagement();

  const [isLoading, setIsLoading] = useState(false);
  const validate = (values: TFormValues): TFormErrors => {
    const errors: TFormErrors = {};

    // Required field validation
    if (!values.sellerCustomerGroupID?.trim()) {
      errors.sellerCustomerGroupID = { missing: true };
    }
    if (!values.mainCatalogProductSelectionID?.trim()) {
      errors.mainCatalogProductSelectionID = { missing: true };
    }

    if (!values.storeKey?.trim()) {
      errors.storeKey = { missing: true };
    }
    return errors;
  };

  const handleBackToDashboard = () => {
    history.goBack();
  };

  const handleSubmit = (values: TFormValues) => {
    setSellertoolsContext(
      values.mainCatalogProductSelectionID,
      values.sellerCustomerGroupID,
      values.storeKey
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await getSelectedCustomerGroup().then((id) => {
        setInitialValues((prev) => ({
          ...prev,
          sellerCustomerGroupID: id || '',
        }));
      });
      await getSelectedProductSelection().then((id) => {
        setInitialValues((prev) => ({
          ...prev,
          mainCatalogProductSelectionID: id || '',
        }));
      });
      await getSelectedStore().then((key) => {
        setInitialValues((prev) => ({
          ...prev,
          storeKey: key || '',
        }));
      });
      setIsLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchStores = async () => {
      const stores = await findStores();
      setStores(stores?.results || []);
    };
    fetchStores();
  }, [findStores]);

  if (isLoading || customerGroupsLoading || productSelectionsLoading) {
    return null;
  }

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
          />
        </div>
      </div>
      <div className={styles.formContainer}>
        <Card className={styles.formCard}>
          <Spacings.Stack scale="l">
            <Formik
              initialValues={initialValues}
              validate={validate}
              onSubmit={handleSubmit}
            >
              {(formikProps) => (
                <form onSubmit={formikProps.handleSubmit}>
                  <Spacings.Stack scale="m">
                    <SelectField
                      isSearchable
                      title={intl.formatMessage(messages.sellerCustomerGroup)}
                      value={formikProps.values.sellerCustomerGroupID}
                      options={customerGroups.map((customerGroup) => ({
                        label: customerGroup.name,
                        value: customerGroup.id,
                      }))}
                      onChange={(event) =>
                        formikProps.setFieldValue(
                          'sellerCustomerGroupID',
                          event.target.value
                        )
                      }
                    />
                    <SelectField
                      isSearchable
                      title={intl.formatMessage(messages.store)}
                      value={formikProps.values.storeKey}
                      options={stores.map((store) => ({
                        label: store.name,
                        value: store.key,
                      }))}
                      onChange={(event) =>
                        formikProps.setFieldValue(
                          'storeKey',
                          event.target.value
                        )
                      }
                    />
                    <SelectField
                      isSearchable
                      title={intl.formatMessage(messages.productSelection)}
                      value={formikProps.values.mainCatalogProductSelectionID}
                      options={productSelections.map((productSelection) => ({
                        label: productSelection.name,
                        value: productSelection.id,
                      }))}
                      onChange={(event) =>
                        formikProps.setFieldValue(
                          'mainCatalogProductSelectionID',
                          event.target.value
                        )
                      }
                    />

                    <div className={styles.buttonsContainer}>
                      <PrimaryButton
                        label={intl.formatMessage(messages.save)}
                        type="submit"
                        onClick={() => {
                          formikProps.handleSubmit();
                        }}
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

export default ManageSellertools;
