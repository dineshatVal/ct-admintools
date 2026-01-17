import Card from '@commercetools-uikit/card';
import CheckboxInput from '@commercetools-uikit/checkbox-input';
import FieldLabel from '@commercetools-uikit/field-label';
import PrimaryButton from '@commercetools-uikit/primary-button';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import { Formik } from 'formik';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';
import { useCustomObject } from '../../hooks/use-custom-objects';
import styles from './manage-feature-flags.module.css';
import messages from './messages';
import { FEATURE_FLAG_VET_KEY } from '../../../constants';

type TFormValues = {
  [FEATURE_FLAG_VET_KEY]: boolean;
};
type TFieldErrors = Record<string, boolean>;

type TFormErrors = Record<string, TFieldErrors>;

const ManageFeatureFlags = () => {
  const intl = useIntl();
  const history = useHistory();
  const { getFeatureFlags, setFeatureFlagsContext } = useCustomObject();
  const [initialValues, setInitialValues] = useState<TFormValues>({
    [FEATURE_FLAG_VET_KEY]: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const validate = (values: TFormValues): TFormErrors => {
    const errors: TFormErrors = {};

    // Required field validation
    if (typeof values[FEATURE_FLAG_VET_KEY] === 'undefined') {
      errors[FEATURE_FLAG_VET_KEY] = { missing: true };
    }

    return errors;
  };

  const handleBackToDashboard = () => {
    history.goBack();
  };

  const handleSubmit = (values: TFormValues) => {
    setFeatureFlagsContext({
      [FEATURE_FLAG_VET_KEY]: values[FEATURE_FLAG_VET_KEY],
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const featureFlags = await getFeatureFlags();
      setInitialValues(featureFlags);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  if (isLoading) {
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
                    <div className={styles.formSection}>
                      <div className={styles.formGrid}>
                        <div>
                          <FieldLabel
                            title={intl.formatMessage(messages.vetStore)}
                          />
                        </div>
                        <CheckboxInput
                          name={FEATURE_FLAG_VET_KEY}
                          onChange={() => {
                            formikProps.setFieldValue(
                              FEATURE_FLAG_VET_KEY,
                              !formikProps.values[FEATURE_FLAG_VET_KEY]
                            );
                          }}
                          isChecked={formikProps.values[FEATURE_FLAG_VET_KEY]}
                        />
                      </div>
                    </div>

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

export default ManageFeatureFlags;
