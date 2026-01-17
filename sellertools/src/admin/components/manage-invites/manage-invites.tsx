import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import TextField from '@commercetools-uikit/text-field';
import PrimaryButton from '@commercetools-uikit/primary-button';
import Card from '@commercetools-uikit/card';
import { useShowNotification } from '@commercetools-frontend/actions-global';
import { NOTIFICATION_KINDS_SIDE } from '@commercetools-frontend/constants';
import useMerchantCenterManagement from '../../hooks/use-merchant-center-management';
import styles from '../onboard-seller/onboard-seller.module.css';

const ManageInvites: React.FC = () => {
  const history = useHistory();
  const showNotification = useShowNotification();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const merchantCenterManagement = useMerchantCenterManagement();

  const handleBackToDashboard = () => {
    history.goBack();
  };

  const handleSendInvitation = async () => {
    if (!email.trim()) {
      showNotification({
        kind: NOTIFICATION_KINDS_SIDE.error,
        domain: 'side',
        text: 'Please enter an email address',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Sending Merchant Center invitation...');
      console.log(`Email: ${email}`);

      const invitationSuccess =
        await merchantCenterManagement.inviteSellerToMerchantCenter(email);

      if (invitationSuccess) {
        console.log('Invitation sent successfully');
        showNotification({
          kind: NOTIFICATION_KINDS_SIDE.success,
          domain: 'side',
          text: `Invitation to sellertools sent to ${email}`,
        });
        setEmail(''); // Clear the form on success
      } else {
        console.warn('Invitation failed');
        showNotification({
          kind: NOTIFICATION_KINDS_SIDE.warning,
          domain: 'side',
          text: `Failed to send invitation to ${email}`,
        });
      }
    } catch (error) {
      console.error('Invitation error:', error);
      showNotification({
        kind: NOTIFICATION_KINDS_SIDE.error,
        domain: 'side',
        text: `Error sending invitation: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <Text.Headline as="h1">Manage Invites</Text.Headline>
          <Text.Detail>
            Sends an invitation to join the Merchant Center platform and grants
            access to the sellertools team and resources
          </Text.Detail>
        </div>
        <div className={styles.actionButtons}>
          <PrimaryButton
            label="Back to Admin Dashboard"
            onClick={handleBackToDashboard}
            isDisabled={isSubmitting || merchantCenterManagement.loading}
          />
        </div>
      </div>

      <div className={styles.formContainer}>
        <Card className={styles.formCard}>
          <Spacings.Stack scale="l">
            <Spacings.Stack scale="m">
              <TextField
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                title="Clinic Email Address"
                placeholder="Enter clinic email address"
                horizontalConstraint={16}
                isRequired
              />

              <div className={styles.buttonsContainer}>
                <PrimaryButton
                  label="Send Invitation"
                  onClick={handleSendInvitation}
                  isDisabled={isSubmitting || merchantCenterManagement.loading}
                  size="20"
                />
              </div>

              {merchantCenterManagement.loading && (
                <Text.Detail tone="information">
                  Sending invitation...
                </Text.Detail>
              )}
            </Spacings.Stack>
          </Spacings.Stack>
        </Card>
      </div>
    </div>
  );
};

export default ManageInvites;
