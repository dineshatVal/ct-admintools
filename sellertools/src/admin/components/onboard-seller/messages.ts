import { defineMessages } from 'react-intl';

export default defineMessages({
  title: {
    id: 'OnboardSeller.title',
    defaultMessage: 'Onboard New Clinic',
  },
  subtitle: {
    id: 'OnboardSeller.subtitle',
    defaultMessage:
      'Create a new clinic',
  },
  backToAdmin: {
    id: 'OnboardSeller.backToAdmin',
    defaultMessage: 'Back',
  },
  companyName: {
    id: 'OnboardSeller.companyName',
    defaultMessage: 'Clinic Name',
  },
  firstName: {
    id: 'OnboardSeller.firstName',
    defaultMessage: 'Admin First Name',
  },
  lastName: {
    id: 'OnboardSeller.lastName',
    defaultMessage: 'Admin Last Name',
  },
  email: {
    id: 'OnboardSeller.email',
    defaultMessage: 'Clinic/Admin Email Address',
  },
  phoneNumber: {
    id: 'OnboardSeller.phoneNumber',
    defaultMessage: 'Phone Number',
  },
  submit: {
    id: 'OnboardSeller.submit',
    defaultMessage: 'Create Clinic',
  },
  errorMissing: {
    id: 'OnboardSeller.error.missing',
    defaultMessage: 'This field is required',
  },
  errorInvalid: {
    id: 'OnboardSeller.error.invalid',
    defaultMessage: 'This field is invalid',
  },
  success: {
    id: 'OnboardSeller.success',
    defaultMessage: 'Clinic {name} has been successfully onboarded!',
  },
  errorGeneral: {
    id: 'OnboardSeller.error.general',
    defaultMessage: 'Failed to onboard clinic. Please try again.',
  },
  invitationSent: {
    id: 'OnboardSeller.invitationSent',
    defaultMessage: 'Invitation to sellertools sent',
  },
  invitationFailed: {
    id: 'OnboardSeller.invitationFailed',
    defaultMessage: 'Seller created but application invitation failed',
  },
});
